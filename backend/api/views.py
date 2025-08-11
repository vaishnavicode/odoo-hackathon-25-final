import logging
import json
import jwt
from datetime import timedelta

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth.hashers import check_password
from django.contrib.auth.decorators import login_required

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .models import (
    UserData, UserAccessToken, Product, ProductPrice
)
from .serializers import (
    UserDataSerializer, ProductSerializer, ProductPriceSerializer
)

from api.authentication import require_access_token   
from utils.message import ERROR_MESSAGES         
from django.contrib.auth.decorators import login_required
from .permissions import IsOwner

logger = logging.getLogger(__name__)


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
        logger.exception("Error in register_user_view")
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
        logger.exception("Error in login_user_view")
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
        logger.exception("Error in logout_user_view")
        return JsonResponse({"isSuccess": False, "error": str(e)}, status=500)


# ----------- Product Views -----------

@api_view(['GET'])
def product_list(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)


@api_view(['POST'])
@require_access_token
def product_create(request):
    data = request.data.copy()
    data['created_by_id'] = request.user.user_data_id  
    
    serializer = ProductSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_201_CREATED)
    return Response({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def product_retrieve(request, id):
    product = get_object_or_404(Product, product_id=id)
    serializer = ProductSerializer(product)
    return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsOwner])
@require_access_token
def product_update(request, id):
    product = get_object_or_404(Product, product_id=id)
    serializer = ProductSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)
    return Response({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsOwner])
@require_access_token
def product_delete(request, id):
    product = get_object_or_404(Product, product_id=id)
    product.delete()
    return Response({"isSuccess": True, "data": f"Product {id} deleted", "error": None}, status=status.HTTP_204_NO_CONTENT)


# ----------- ProductPrice Views -----------

@api_view(['GET'])
def product_price_list(request, id):
    if not Product.objects.filter(product_id=id).exists():
        return Response({"isSuccess": False, "error": "Invalid product ID."}, status=status.HTTP_400_BAD_REQUEST)

    prices = ProductPrice.objects.filter(product_id=id)
    serializer = ProductPriceSerializer(prices, many=True)
    return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)


@api_view(['POST'])
@require_access_token
def product_price_create(request, id):
    if not Product.objects.filter(product_id=id).exists():
        return Response({"isSuccess": False, "error": "Invalid product ID."}, status=status.HTTP_400_BAD_REQUEST)

    data = request.data.copy()
    data['product_id'] = id
    serializer = ProductPriceSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_201_CREATED)
    return Response({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def product_price_retrieve(request, id, price_id):
    price = get_object_or_404(ProductPrice, product_price_id=price_id, product_id=id)
    serializer = ProductPriceSerializer(price)
    return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)


@api_view(['PUT'])
@login_required
@permission_classes([IsOwner])
@require_access_token
def product_price_update(request, id, price_id):
    price = get_object_or_404(ProductPrice, product_price_id=price_id, product_id=id)
    serializer = ProductPriceSerializer(price, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)
    return Response({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@login_required
@require_access_token
@permission_classes([IsOwner])
def product_price_delete(request, id, price_id):
    price = get_object_or_404(ProductPrice, product_price_id=price_id, product_id=id)
    price.delete()
    return Response({"isSuccess": True, "data": f"ProductPrice {price_id} deleted", "error": None}, status=status.HTTP_204_NO_CONTENT)
