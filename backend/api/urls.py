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
    path('product/<int:product_id>/like', like_product, name='like-product'),

    # Order URLs
    path('orders/', order_list, name='order-list'),
    path('orders/<int:id>/', order_list, name='order-details'),
    path('orders/create/', order_create, name='order-create'),
    path('orders/<int:order_id>/confirm', order_confirm, name='order-retrieve'),
    path('orders/<int:order_id>/cancel/', cancel_order, name='order-cancel'),

    # User URLs
    path('register/', register_user_view, name='register_user'),
    path('login/', login_user_view, name='login_user'),
    path('login/forgot-password/', forgot_password_view, name='forgot_password'),
    path('login/reset-password/', reset_password_view, name='reset-password'),
    path('logout/', logout_user_view, name='logout_user'),
    path('user/profile/', user_profile, name='user-profile'),
    path('user/wishlist/toggle/<int:product_id>/', toggle_wishlist, name='toggle-wishlist'),
    path('user/products/', user_products, name='user-products'),

    
    # Generic URLs
    path('statuses/', status_list, name='status-list'),
    path('categories/', category_list, name='category-list'),

]
