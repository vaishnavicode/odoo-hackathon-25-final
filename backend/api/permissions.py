from rest_framework import permissions
from .models import UserAccessToken
from functools import wraps
from django.http import JsonResponse
from rest_framework import status as drf_status

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access/modify it.
    Works with UserData model instead of Django's default User model.
    """

    def has_object_permission(self, request, view, obj):
        # Ensure the user is authenticated via your token system
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = auth_header.split(' ')[1] if ' ' in auth_header else None
        if not token:
            return False

        try:
            access_token = UserAccessToken.objects.get(
                user_access_token=token,
                active=True
            )
        except UserAccessToken.DoesNotExist:
            return False

        current_user = access_token.user_data

        # Check if the object has a 'user_data' field (direct owner)
        if hasattr(obj, 'user_data'):
            return obj.user_data == current_user

        # Check if the object has a 'created_by' field (e.g., Product)
        if hasattr(obj, 'created_by'):
            return obj.created_by == current_user

        # If the object is UserData itself
        if isinstance(obj, type(current_user)):
            return obj == current_user

        return False


def role_required(allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            user = request.user
            if not user or not hasattr(user, 'user_role') or not user.user_role:
                return JsonResponse(
                    {"isSuccess": False, "error": "User role not found."},
                    status=drf_status.HTTP_403_FORBIDDEN
                )
            if user.user_role.user_role_name.lower() not in allowed_roles:
                return JsonResponse(
                    {"isSuccess": False, "error": "Access denied: insufficient role permissions."},
                    status=drf_status.HTTP_403_FORBIDDEN
                )
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

def vendor_required(view_func):
    return role_required(['vendor'])(view_func)

def customer_required(view_func):
    return role_required(['customer'])(view_func)


# DRF Permission classes for role-based access
class IsVendor(permissions.BasePermission):
    """
    Allows access only to users with 'vendor' role.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not hasattr(user, 'user_role') or not user.user_role:
            return False
        return user.user_role.user_role_name.lower() == 'vendor'


class IsCustomer(permissions.BasePermission):
    """
    Allows access only to users with 'customer' role.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not hasattr(user, 'user_role') or not user.user_role:
            return False
        return user.user_role.user_role_name.lower() == 'customer'
