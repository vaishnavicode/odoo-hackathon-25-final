# Standard library imports
import json
from datetime import timedelta

# Third-party imports
import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.db.models import F
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
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
            return JsonResponse({"isSuccess": False, "error": ERROR_MESSAGES.get('MISSING_CREDENTIALS')}, status=400)

        try:
            user = UserData.objects.get(user_email=user_email, active=True)
        except UserData.DoesNotExist:
            return JsonResponse({"isSuccess": False, "error": ERROR_MESSAGES.get('INVALID_CREDENTIALS')}, status=401)

        if not check_password(password, user.user_password):
            return JsonResponse({"isSuccess": False, "error": ERROR_MESSAGES.get('INVALID_CREDENTIALS')}, status=401)

        # Invalidate old tokens
        UserAccessToken.objects.filter(user_data=user, active=True).update(active=False)

        now = timezone.now()
        expiry = now + timedelta(days=7)
        payload = {'user_id': str(user.user_data_id), 'iat': int(now.timestamp()), 'exp': int(expiry.timestamp())}
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        UserAccessToken.objects.create(
            user_data=user,
            user_access_token=token,
            user_access_token_expiry=expiry,
            active=True
        )
        return JsonResponse({
            "isSuccess": True,
            "data": {
                "user_id": user.user_data_id,
                "user_email": user.user_email,
                "user_name": user.user_name,
                "access_token": token,
                "token_expiry": expiry.isoformat()
            },
            "error": None
        }, status=200)

    except Exception as e:
        return JsonResponse({"isSuccess": False, "error": str(e)}, status=500)


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

    paginator = PageNumberPagination()
    paginator.page_size = 10  

    result_page = paginator.paginate_queryset(products, request)
    serializer = ProductSerializer(result_page, many=True)

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


@api_view(['GET'])
def product_retrieve(request, id):
    product = get_object_or_404(Product, product_id=id)
    serializer = ProductSerializer(product)
    return JsonResponse({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)


@api_view(['POST'])
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
