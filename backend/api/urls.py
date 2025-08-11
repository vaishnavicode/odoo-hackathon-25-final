from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user_view, name='register_user'),
    path('login/', views.login_user_view, name='login_user'),
    path('logout/', views.logout_user_view, name='logout_user'),
]
