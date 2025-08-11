from rest_framework.authentication import BaseAuthentication
from django.utils import timezone
from django.http import JsonResponse
from api.models import UserAccessToken
from functools import wraps
from utils.message import ERROR_MESSAGES
from django.conf import settings
import jwt


class AccessTokenAuthentication(BaseAuthentication):
    """
    Custom authentication using user_access_token from the Authorization header.
    Validates both DB and JWT expiry.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return None  

        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return None  
        except jwt.InvalidTokenError:
            return None  

        try:
            access_token = UserAccessToken.objects.select_related('user_data').get(
                user_access_token=token,
                active=True,
                user_data__active=True
            )
        except UserAccessToken.DoesNotExist:
            return None 
        
        if access_token.user_access_token_expiry and access_token.user_access_token_expiry < timezone.now():
            return None 

        access_token.last_used_at = timezone.now()
        access_token.save(update_fields=['last_used_at'])

        return (access_token.user_data, None)


def require_access_token(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')

        # Case 1: No token
        if not auth_header:
            return JsonResponse({
                "isSuccess": False,
                "data": None,
                "error": "No token provided."
            }, status=401)

        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                "isSuccess": False,
                "data": None,
                "error": "Invalid token format. Expected 'Bearer <token>'."
            }, status=401)

        user_authenticator = AccessTokenAuthentication()
        user_auth_tuple = user_authenticator.authenticate(request)

        # Case 2: Invalid or expired token
        if not user_auth_tuple:
            return JsonResponse({
                "isSuccess": False,
                "data": None,
                "error": ERROR_MESSAGES.get("AUTHENTICATION_INVALID", "Invalid or expired token.")
            }, status=401)

        request.user = user_auth_tuple[0]
        return view_func(request, *args, **kwargs)

    return _wrapped_view
