from django.urls import path
from .views import *

urlpatterns = [
    # Product URLs
    path('products/', product_list, name='product-list'),
    path('products/create/', product_create, name='product-create'),
    path('products/<int:id>/', product_retrieve, name='product-retrieve'),
    path('products/<int:id>/update/', product_update, name='product-update'),
    path('products/<int:id>/delete/', product_delete, name='product-delete'),

    # ProductPrice URLs (nested)
    path('products/<int:id>/prices/', product_price_list, name='product-price-list'),
    path('products/<int:id>/prices/create/', product_price_create, name='product-price-create'),
    path('products/<int:id>/prices/<int:price_id>/', product_price_retrieve, name='product-price-retrieve'),
    path('products/<int:id>/prices/<int:price_id>/update/', product_price_update, name='product-price-update'),
    path('products/<int:id>/prices/<int:price_id>/delete/', product_price_delete, name='product-price-delete'),

    # Auth URLs
    path('register/', register_user_view, name='register_user'),
    path('login/', login_user_view, name='login_user'),
    path('logout/', logout_user_view, name='logout_user'),
]
