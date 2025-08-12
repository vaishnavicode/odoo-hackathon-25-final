# Standard library imports
import json
from datetime import timedelta
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_aware

# Third-party imports
import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.db.models import F
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.template.loader import render_to_string
from datetime import datetime
from django.utils.timezone import make_aware


from rest_framework import status as drf_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

# Local application imports
from .models import *
from .serializers import *
from .permissions import IsOwner
from api.authentication import require_access_token
from utils.message import ERROR_MESSAGES
from utils.email import send_mail
from .permissions import vendor_required, customer_required

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q

from .models import Product, Order


@csrf_exempt
@require_http_methods(['POST'])
def register_user_view(request):
    try:
        data = json.loads(request.body)
        serializer = UserDataSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({"isSuccess": True, "data": serializer.data, "error": None}, status=201)
        return JsonResponse({"isSuccess": False, "data": None, "error": serializer.errors}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"isSuccess": False, "data": None, "error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"isSuccess": False, "data": None, "error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(['POST'])
def login_user_view(request):
    try:
        data = json.loads(request.body)
        user_email = data.get('user_email')
        password = data.get('user_password')

        if not user_email or not password:
            return JsonResponse({
                "isSuccess": False,
                "error": ERROR_MESSAGES.get('MISSING_CREDENTIALS', 'Missing email or password')
            }, status=400)

        try:
            user = UserData.objects.get(user_email=user_email, active=True)
        except UserData.DoesNotExist:
            return JsonResponse({
                "isSuccess": False,
                "error": ERROR_MESSAGES.get('INVALID_CREDENTIALS', 'Invalid email or password')
            }, status=401)

        if not check_password(password, user.user_password):
            return JsonResponse({
                "isSuccess": False,
                "error": ERROR_MESSAGES.get('INVALID_CREDENTIALS', 'Invalid email or password')
            }, status=401)

        UserAccessToken.objects.filter(user_data=user, active=True).update(active=False)

        now = timezone.now()
        expiry = now + timedelta(days=7)
        payload = {
            'user_id': str(user.user_data_id),
            'iat': int(now.timestamp()),
            'exp': int(expiry.timestamp())
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        UserAccessToken.objects.create(
            user_data=user,
            user_access_token=token,
            user_access_token_expiry=expiry,
            active=True
        )

        user_serialized = UserDataSerializer(user)

        return JsonResponse({
            "isSuccess": True,
            "data": {
                "user_id": user.user_data_id,
                "user_data": user_serialized.data,
                "access_token": token,
                "token_expiry": expiry.isoformat()
            },
            "error": None
        }, status=200)

    except Exception as e:
        return JsonResponse({
            "isSuccess": False,
            "error": str(e)
        }, status=500)


@api_view(['POST'])
def forgot_password_view(request):
    email = request.data.get('email')
    if not email:
        return JsonResponse({
            "isSuccess": False, 
            "error": "Email is required."
        }, status=drf_status.HTTP_400_BAD_REQUEST)
    
    try:
        user = get_object_or_404(UserData, user_email=email, active=True)
        reset_token_obj = PasswordResetToken.objects.create(user=user)

        html_message = render_to_string('password_reset_email.html', {'token': reset_token_obj.token})

        send_mail(
            subject="Password Reset Request",
            message=f"Use this token to reset your password: {reset_token_obj.token}",  
            from_email=None,
            recipient_list=[email],
            html_message=html_message,  
        )

        return JsonResponse({
            "isSuccess": True,
            "data": "Password reset instructions sent to your email.",
            "error": None
        }, status=drf_status.HTTP_200_OK)

    except Http404:
        return JsonResponse({
            "isSuccess": False,
            "error": "User with this email does not exist or is inactive."
        }, status=drf_status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return JsonResponse({
            "isSuccess": False,
            "error": str(e)
        }, status=drf_status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def reset_password_view(request):
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    if not token or not new_password:
        return JsonResponse({
            "isSuccess": False,
            "error": "Token and new password are required."
        }, status=drf_status.HTTP_400_BAD_REQUEST)

    try:
        reset_token_obj = PasswordResetToken.objects.get(token=token)
        if not reset_token_obj.is_valid():
            return JsonResponse({
                "isSuccess": False,
                "error": "Token has expired."
            }, status=drf_status.HTTP_400_BAD_REQUEST)

        user = reset_token_obj.user
        user.user_password = make_password(new_password)
        user.save()

        reset_token_obj.delete()

        return JsonResponse({
            "isSuccess": True,
            "data": "Password has been reset successfully.",
            "error": None
        }, status=drf_status.HTTP_200_OK)

    except PasswordResetToken.DoesNotExist:
        return JsonResponse({
            "isSuccess": False,
            "error": "Invalid token."
        }, status=drf_status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return JsonResponse({"isSuccess": False, "error": str(e)}, status=drf_status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@require_http_methods(['POST'])
@require_access_token
def logout_user_view(request):
    try:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = auth_header.split(' ')[1] if ' ' in auth_header else None
        if not token:
            return JsonResponse({"isSuccess": False, "error": "Missing token"}, status=400)

        try:
            token_record = UserAccessToken.objects.get(user_access_token=token, active=True)
            token_record.active = False
            token_record.save()
            return JsonResponse({"isSuccess": True, "data": {"message": "Logged out"}}, status=200)
        except UserAccessToken.DoesNotExist:
            return JsonResponse({"isSuccess": False, "error": "Invalid or expired token"}, status=401)

    except Exception as e:
        return JsonResponse({"isSuccess": False, "error": str(e)}, status=500)


# ----------- Product Views -----------

@api_view(['GET'])
def product_list(request):
    products = Product.objects.all().order_by('product_id')

    # Get page size from query parameters, default to 10
    page_size = request.GET.get('page_size', 10)
    try:
        page_size = int(page_size)
        if page_size < 1 or page_size > 100:  # Limit page size to prevent abuse
            page_size = 10
    except ValueError:
        page_size = 10

    paginator = PageNumberPagination()
    paginator.page_size = page_size

    result_page = paginator.paginate_queryset(products, request)
    serializer = ProductSerializer(result_page, many=True)

    return JsonResponse({
        "isSuccess": True,
        "data": {
            "results": serializer.data,
            "total_items": paginator.page.paginator.count,
            "total_pages": paginator.page.paginator.num_pages,
            "current_page": paginator.page.number,
            "page_size": page_size,
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link()
        },
        "error": None
    }, status=drf_status.HTTP_200_OK)


@api_view(['GET'])
def product_retrieve(request, id):
    product = get_object_or_404(Product, product_id=id)
    serializer = ProductSerializer(product)
    return JsonResponse({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)


@api_view(['POST'])
@vendor_required
@require_access_token
def product_create(request):
    data = request.data.copy()
    data['created_by_id'] = request.user.user_data_id

    category_name = data.get('category_name')
    if category_name:
        category, created = Category.objects.get_or_create(category_name=category_name)
        data['category_id'] = category.category_id
    else:
        data['category_id'] = 1

    serializer = ProductSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return JsonResponse({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_201_CREATED)
    return JsonResponse({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@vendor_required
@permission_classes([IsOwner])
@require_access_token
def product_update(request, id):
    product = get_object_or_404(Product, product_id=id)

    if product.created_by != request.user:
        return JsonResponse({"isSuccess": False, "error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

    data = request.data.copy()

    category_name = data.get('category_name')
    if category_name:
        category, created = Category.objects.get_or_create(category_name=category_name)
        data['category_id'] = category.category_id

    serializer = ProductSerializer(product, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return JsonResponse({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)
    return JsonResponse({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@vendor_required
@permission_classes([IsOwner])
@require_access_token
def product_delete(request, id):
    product = get_object_or_404(Product, product_id=id)
    product.delete()
    return JsonResponse({"isSuccess": True, "data": f"Product {id} deleted", "error": None}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsOwner])
@require_access_token
def like_product(request, product_id):
    user = request.user
    product = get_object_or_404(Product, product_id=product_id)

    try:
        with transaction.atomic():
            like_obj = ProductLike.objects.filter(user=user, product=product).first()
            
            if like_obj:
                like_obj.delete()
                product.likes = F('likes') - 1
                action = "unliked"
            else:
                ProductLike.objects.create(user=user, product=product)
                product.likes = F('likes') + 1
                action = "liked"

            product.save(update_fields=['likes'])
            product.refresh_from_db()

        return JsonResponse({
            "isSuccess": True,
            "data": {
                "product_id": product.product_id,
                "likes": product.likes,
                "action": action
            },
            "error": None
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return JsonResponse({"isSuccess": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ----------- ProductPrice Views -----------

@api_view(['GET'])
def product_price_list(request, id):
    if not Product.objects.filter(product_id=id).exists():
        return JsonResponse({
            "isSuccess": False,
            "error": "Invalid product ID."
        }, status=status.HTTP_400_BAD_REQUEST)

    prices = ProductPrice.objects.filter(product_id=id).order_by('product_price_id')

    paginator = PageNumberPagination()
    paginator.page_size = 10

    result_page = paginator.paginate_queryset(prices, request)
    serializer = ProductPriceSerializer(result_page, many=True)

    return JsonResponse({
        "isSuccess": True,
        "data": {
            "results": serializer.data,
            "total_items": paginator.page.paginator.count,
            "total_pages": paginator.page.paginator.num_pages,
            "current_page": paginator.page.number,
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link()
        },
        "error": None
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@vendor_required
@permission_classes([IsOwner])
@require_access_token
def product_price_create(request, id):
    if not Product.objects.filter(product_id=id).exists():
        return JsonResponse({"isSuccess": False, "error": "Invalid product ID."}, status=status.HTTP_400_BAD_REQUEST)

    data = request.data.copy()
    time_duration = data.get('time_duration')
    
    if not time_duration or time_duration.lower().strip() not in ['hour','day', 'week', 'month', 'year']:
        return JsonResponse({"isSuccess": False, "error": "Invalid or missing time duration."}, status=status.HTTP_400_BAD_REQUEST)
    
    data['product_id'] = id
    serializer = ProductPriceSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return JsonResponse({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_201_CREATED)
    return JsonResponse({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def product_price_retrieve(request, id, price_id):
    price = get_object_or_404(ProductPrice, product_price_id=price_id, product_id=id)
    serializer = ProductPriceSerializer(price)
    return JsonResponse({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)


@api_view(['PUT'])
@vendor_required
@permission_classes([IsOwner])
@require_access_token
def product_price_update(request, id, price_id):
    price = get_object_or_404(ProductPrice, product_price_id=price_id, product_id=id)
    serializer = ProductPriceSerializer(price, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return JsonResponse({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)
    return JsonResponse({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@vendor_required
@require_access_token
@permission_classes([IsOwner])
def product_price_delete(request, id, price_id):
    price = get_object_or_404(ProductPrice, product_price_id=price_id, product_id=id)
    price.delete()
    return JsonResponse({"isSuccess": True, "data": f"ProductPrice {price_id} deleted", "error": None}, status=status.HTTP_204_NO_CONTENT)


# ----------- Order Views -----------

@api_view(['GET'])
@require_access_token
def order_list(request, id=None):
    user_id = request.user.user_data_id  

    orders = Order.objects.filter(user_data_id=user_id)

    if id:
        orders = orders.filter(order_id=id)
        if not orders.exists():
            return JsonResponse(
                {"isSuccess": False, "error": "Invalid order ID for this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

    paginator = PageNumberPagination()
    paginator.page_size = 10  

    result_page = paginator.paginate_queryset(orders, request)
    serializer = OrderSerializer(result_page, many=True)

    return JsonResponse({
        "isSuccess": True,
        "data": {
            "results": serializer.data,
            "total_items": paginator.page.paginator.count,
            "total_pages": paginator.page.paginator.num_pages,
            "current_page": paginator.page.number,
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link()
        },
        "error": None
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@customer_required
@permission_classes([IsOwner])
@require_access_token
def order_create(request):
    data = request.data.copy()

    try:
        user_data_id = request.user.user_data_id
    except AttributeError:
        return JsonResponse({"isSuccess": False, "error": "User data not found for this user."}, status=status.HTTP_400_BAD_REQUEST)

    if not Product.objects.filter(product_id=data.get('product_id')).exists():
        return JsonResponse({"isSuccess": False, "error": "Invalid product ID."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            payment_data = {
                "invoice_type_id": 1,
                "payment_percentage": 0,
                "status_id": 1,  
                "active": True,
            }
            payment_serializer = PaymentSerializer(data=payment_data)
            if not payment_serializer.is_valid():
                return JsonResponse({"isSuccess": False, "error": payment_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            payment = payment_serializer.save()

            order_data = {
                "product_id": data.get("product_id"),
                "user_data_id": user_data_id,
                "payment_id": payment.payment_id,
                "status_id": 1, 
                "timestamp_from": data.get("timestamp_from"),
                "timestamp_to": data.get("timestamp_to")
            }
            order_serializer = OrderSerializer(data=order_data)
            if not order_serializer.is_valid():
                raise ValueError(order_serializer.errors)
            order_serializer.save()

        return JsonResponse({
            "isSuccess": True,
            "data": {
                "payment": payment_serializer.data,
                "order": order_serializer.data
            },
            "error": None
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return JsonResponse({"isSuccess": False, "data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@customer_required
@permission_classes([IsOwner])
@require_access_token
def order_confirm(request, order_id):
    order = get_object_or_404(Order, order_id=order_id, user_data_id=request.user.user_data_id)

    delivery_address = getattr(request.user, 'user_address', None)
    if not delivery_address:
        return JsonResponse({
            "isSuccess": False,
            "error": "User delivery address not found. Please update your address."
        }, status=500)

    try:
        with transaction.atomic():
            order.status_id = 5
            order.save()

            delivery_data = {
                "order_id": order.order_id,
                "delivery_address": delivery_address,
                "delivery_date": None,
                "delivery_at": None,
                "status_id": 1,
                "active": True,
            }
            delivery_serializer = DeliverySerializer(data=delivery_data)
            if not delivery_serializer.is_valid():
                return JsonResponse({"isSuccess": False, "error": delivery_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            delivery = delivery_serializer.save()

        return JsonResponse({
            "isSuccess": True,
            "data": {
                "order": OrderSerializer(order).data,
                "delivery": DeliverySerializer(delivery).data,
            },
            "error": None
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return JsonResponse({"isSuccess": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@customer_required
@permission_classes([IsOwner])
@require_access_token
def cancel_order(request, order_id):
    order = get_object_or_404(Order, order_id=order_id, user_data_id=request.user.user_data_id)
    
    cancelled_status = Status.objects.filter(status_name='cancelled').first()
    if not cancelled_status:
        return JsonResponse({
            "isSuccess": False,
            "error": "Cancelled status not found in the status table."
        }, status=drf_status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    try:
        with transaction.atomic():
            order.status = cancelled_status
            order.save()

            deliveries = order.deliveries.all()
            for delivery in deliveries:
                delivery.status = cancelled_status
                delivery.active = False  
                delivery.save()

            # Update related payments status
            payment = getattr(order, 'payment', None)
            if payment:
                payment.status = cancelled_status
                payment.active = False  
                payment.save()
        
        return JsonResponse({
            "isSuccess": True,
            "data": {
                "order_id": order.order_id,
                "status": cancelled_status.status_id,
                "deliveries_updated": deliveries.count(),
                "payment_updated": payment.payment_id if payment else None
            },
            "error": None
        }, status=drf_status.HTTP_200_OK)
    
    except Exception as e:
        return JsonResponse({"isSuccess": False, "error": str(e)}, status=drf_status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def status_list(request):
    statuses = Status.objects.all()
    serializer = StatusSerializer(statuses, many=True)
    return JsonResponse({
        "isSuccess": True,
        "data": serializer.data,
        "error": None
    }, status=drf_status.HTTP_200_OK)


@api_view(['GET'])
def category_list(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return JsonResponse({
        "isSuccess": True,
        "data": serializer.data,
        "error": None
    }, status=drf_status.HTTP_200_OK)


@api_view(['GET'])
@require_access_token
def user_profile(request):
    user = request.user

    user_data = {
        "user_data_id": user.user_data_id,
        "user_name": user.user_name,
        "user_email": user.user_email,
        "user_contact": user.user_contact,
        "user_address": user.user_address,
        "active": user.active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }

    wishlist_qs = Wishlist.objects.filter(user=user).select_related('product')

    paginator = PageNumberPagination()
    paginator.page_size = 10  
    wishlist_page = paginator.paginate_queryset(wishlist_qs, request)

    wishlist_data = [
        {
            "product_id": item.product.product_id,
            "product_name": item.product.product_name,
            "product_description": item.product.product_description,
            "product_qty": item.product.product_qty,
            "likes": item.product.likes,
            "active": item.product.active,
        }
        for item in wishlist_page
    ]

    return JsonResponse({
        "isSuccess": True,
        "data": {
            "user": user_data,
            "wishlist": {
                "results": wishlist_data,
                "total_items": paginator.page.paginator.count,
                "total_pages": paginator.page.paginator.num_pages,
                "current_page": paginator.page.number,
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link()
            }
        },
        "error": None
    }, status=drf_status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsOwner])
@require_access_token
def toggle_wishlist(request, product_id):
    user = request.user
    product = get_object_or_404(Product, product_id=product_id)

    try:
        with transaction.atomic():
            wishlist_item = Wishlist.objects.filter(user=user, product=product).first()

            if wishlist_item:
                wishlist_item.delete()
                action = "removed"
            else:
                Wishlist.objects.create(user=user, product=product)
                action = "added"

        return JsonResponse({
            "isSuccess": True,
            "data": {
                "product_id": product.product_id,
                "action": action
            },
            "error": None
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return JsonResponse({"isSuccess": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@vendor_required
@require_access_token
def user_products(request):
    user = request.user

    products_qs = Product.objects.filter(created_by_id=user.user_data_id).order_by('product_id')

    paginator = PageNumberPagination()
    paginator.page_size = 10
    products_page = paginator.paginate_queryset(products_qs, request)

    serializer = ProductSerializer(products_page, many=True)

    return JsonResponse({
        "isSuccess": True,
        "data": {
            "results": serializer.data,
            "total_items": paginator.page.paginator.count,
            "total_pages": paginator.page.paginator.num_pages,
            "current_page": paginator.page.number,
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link()
        },
        "error": None
    }, status=drf_status.HTTP_200_OK)


@api_view(['POST'])
@require_access_token
@permission_classes([IsOwner])
def update_profile_view(request):
    user = request.user 

    user_address = request.data.get('user_address')
    user_contact = request.data.get('user_contact')
    new_password = request.data.get('new_password')

    if user_address is not None:
        user.user_address = user_address

    if user_contact is not None:
        user.user_contact = user_contact

    if new_password:
        user.user_password = make_password(new_password)

    try:
        user.save()
        return JsonResponse({
            "isSuccess": True,
            "data": "Profile updated successfully.",
            "error": None
        }, status=drf_status.HTTP_200_OK)
    except Exception as e:
        return JsonResponse({
            "isSuccess": False,
            "error": str(e)
        }, status=drf_status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def user_role_list(request):
    roles = UserRole.objects.all()
    serializer = UserRoleSerializer(roles, many=True)
    return JsonResponse({
        "isSuccess": True,
        "data": serializer.data,
        "error": None
    }, status=drf_status.HTTP_200_OK)


@api_view(['GET'])
@require_access_token
@vendor_required
def vendor_report(request):
    try:
        user = request.user

        products = Product.objects.filter(created_by=user, active=True)

        completed_status = 'completed'
        completed_orders = Order.objects.filter(product__in=products, status__status_name=completed_status)

        total_orders = completed_orders.count()

        recent_orders_qs = completed_orders.order_by('-created_at')[:5]
        recent_orders = [
            {
                "order_id": o.order_id,
                "product_name": o.product.product_name,
                "order_date": o.created_at,
                "status": o.status.status_name
            }
            for o in recent_orders_qs
        ]

        product_performance = products.annotate(
            orders_count=Count('orders', filter=Q(orders__status__status_name=completed_status))
        ).values('product_id', 'product_name', 'orders_count')

        return Response({
            "isSuccess": True,
            "data": {
                "total_orders": total_orders,
                "recent_orders": recent_orders,
                "product_performance": list(product_performance),
            },
            "error": None
        })

    except Exception as e:
        return Response({
            "isSuccess": False,
            "data": None,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@customer_required
@permission_classes([IsOwner])
@require_access_token
def cart_list(request):
    """List all items in the user's cart."""
    user_data_id = request.user.user_data_id
    cart_items = Cart.objects.filter(user_id=user_data_id)
    serializer = CartSerializer(cart_items, many=True)
    return JsonResponse({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)


@api_view(['POST'])
@customer_required
@require_access_token
def cart_add(request):
    user_data_id = request.user.user_data_id
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))
    timestamp_from_str = request.data.get('timestamp_from')
    timestamp_to_str = request.data.get('timestamp_to')

    if not Product.objects.filter(product_id=product_id, active=True).exists():
        return JsonResponse({"isSuccess": False, "error": "Invalid or inactive product."}, status=status.HTTP_400_BAD_REQUEST)

    if not timestamp_from_str or not timestamp_to_str:
        return JsonResponse({"isSuccess": False, "error": "Both timestamp_from and timestamp_to are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Parse datetime safely (handles Z and timezones)
        timestamp_from = parse_datetime(timestamp_from_str)
        timestamp_to = parse_datetime(timestamp_to_str)

        if not timestamp_from or not timestamp_to:
            raise ValueError("Invalid datetime format. Use ISO 8601 format like 2025-08-15T10:00:00Z.")

        # Ensure timezone aware
        if timezone.is_naive(timestamp_from):
            timestamp_from = make_aware(timestamp_from)
        if timezone.is_naive(timestamp_to):
            timestamp_to = make_aware(timestamp_to)

        with transaction.atomic():
            cart_item, created = Cart.objects.get_or_create(
                user_id=user_data_id,
                product_id=product_id,
                timestamp_from=timestamp_from,
                timestamp_to=timestamp_to,
                defaults={'quantity': quantity}
            )
            if not created:
                cart_item.quantity += quantity
                cart_item.save()

        return JsonResponse({"isSuccess": True, "data": CartSerializer(cart_item).data, "error": None}, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return JsonResponse({"isSuccess": False, "data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return JsonResponse({"isSuccess": False, "data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@customer_required
@permission_classes([IsOwner])
@require_access_token
def cart_remove(request, product_id):
    """Remove a product from the cart."""
    user_data_id = request.user.user_data_id
    deleted, _ = Cart.objects.filter(user_id=user_data_id, product_id=product_id).delete()

    if deleted:
        return JsonResponse({"isSuccess": True, "data": f"Product {product_id} removed from cart.", "error": None}, status=status.HTTP_200_OK)
    else:
        return JsonResponse({"isSuccess": False, "error": "Product not found in cart."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@customer_required
@permission_classes([IsOwner])
@require_access_token
def cart_clear(request):
    """Clear the user's cart."""
    user_data_id = request.user.user_data_id
    Cart.objects.filter(user_id=user_data_id).delete()
    return JsonResponse({"isSuccess": True, "data": "Cart cleared successfully.", "error": None}, status=status.HTTP_200_OK)


@api_view(['POST'])
@customer_required
@require_access_token
def checkout(request):
    try:
        user_data_id = request.user.user_data_id
    except AttributeError:
        return JsonResponse({"isSuccess": False, "error": "User not found."}, status=400)

    cart_items = Cart.objects.filter(user_id=user_data_id)
    if not cart_items.exists():
        return JsonResponse({"isSuccess": False, "error": "Cart is empty."}, status=400)

    created_orders = []
    created_payments = []

    try:
        with transaction.atomic():
            for cart_item in cart_items:
                payment_data = {
                    "invoice_type_id": 1,       
                    "payment_percentage": 0,
                    "status_id": 1,             
                    "active": True,
                }
                payment_serializer = PaymentSerializer(data=payment_data)
                payment_serializer.is_valid(raise_exception=True)
                payment = payment_serializer.save()
                created_payments.append(payment_serializer.data)

                # 2️⃣ Create Order
                order_data = {
                    "product_id": cart_item.product_id,
                    "user_data_id": user_data_id,
                    "payment_id": payment.payment_id,
                    "status_id": 1,  # started
                    "timestamp_from": cart_item.timestamp_from,
                    "timestamp_to": cart_item.timestamp_to
                }
                order_serializer = OrderSerializer(data=order_data)
                order_serializer.is_valid(raise_exception=True)
                order = order_serializer.save()
                created_orders.append(order_serializer.data)

            cart_items.delete()

        return JsonResponse({
            "isSuccess": True,
            "data": {
                "orders": created_orders,
                "payments": created_payments
            },
            "error": None
        }, status=201)

    except Exception as e:
        return JsonResponse({"isSuccess": False, "data": None, "error": str(e)}, status=400)
