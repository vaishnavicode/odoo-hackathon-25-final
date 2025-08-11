from django.urls import path
from .views import (
    product_list_create,
    product_detail,
    product_price_list_create,
    product_price_detail,
)

urlpatterns = [
    path('products/', product_list_create, name='product-list-create'),
    path('products/<int:id>/', product_detail, name='product-detail'),
    path('products/<int:id>/prices/', product_price_list_create, name='product-price-list-create'),
    path('products/<int:id>/prices/<int:price_id>/', product_price_detail, name='product-price-detail'),
]
