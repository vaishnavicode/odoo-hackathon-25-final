from django.urls import path
from .views import *

urlpatterns = [
    path('products/', product_list_create, name='product-list-create'),
    path('products/<int:id>/', product_detail, name='product-detail'),
    path('products/<int:id>/prices/', product_price_list_create, name='product-price-list-create'),
    path('products/<int:id>/prices/<int:price_id>/', product_price_detail, name='product-price-detail'),
    path('register/', register_user_view, name='register_user'),
    path('login/', login_user_view, name='login_user'),
    path('logout/', logout_user_view, name='logout_user'),
]
