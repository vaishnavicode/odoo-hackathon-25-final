# permissions.py
from rest_framework import permissions
from .models import UserAccessToken

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
