# permissions.py
from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access/modify it.
    Assumes the model instance has an `owner` or `user_data` attribute.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for owners only
        # You can tweak this to allow read for everyone if you want
        owner_attr = getattr(obj, "owner", None) or getattr(obj, "user_data", None)
        return owner_attr == request.user
