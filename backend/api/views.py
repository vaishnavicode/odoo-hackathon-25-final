from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Product, ProductPrice
from .serializers import ProductSerializer, ProductPriceSerializer
from django.shortcuts import get_object_or_404


# Product Views

@api_view(['GET', 'POST'])
def product_list_create(request):
    if request.method == 'GET':
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_201_CREATED)
        return Response({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def product_detail(request, id):
    product = get_object_or_404(Product, product_id=id)

    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)
        return Response({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        product.delete()
        return Response({"isSuccess": True, "data": f"Product {id} deleted", "error": None}, status=status.HTTP_204_NO_CONTENT)


# ProductPrice Views

@api_view(['GET', 'POST'])
def product_price_list_create(request, id):
    if not Product.objects.filter(product_id=id).exists():
        return Response({"isSuccess": False, "error": "Invalid product ID."}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        prices = ProductPrice.objects.filter(product_id=id)
        serializer = ProductPriceSerializer(prices, many=True)
        return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        data = request.data.copy()
        data['product'] = id

        serializer = ProductPriceSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_201_CREATED)
        return Response({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def product_price_detail(request, id, price_id):
    price = get_object_or_404(ProductPrice, product_price_id=price_id, product_id=id)

    if request.method == 'GET':
        serializer = ProductPriceSerializer(price)
        return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = ProductPriceSerializer(price, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"isSuccess": True, "data": serializer.data, "error": None}, status=status.HTTP_200_OK)
        return Response({"isSuccess": False, "data": None, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        price.delete()
        return Response({"isSuccess": True, "data": f"ProductPrice {price_id} deleted", "error": None}, status=status.HTTP_204_NO_CONTENT)
