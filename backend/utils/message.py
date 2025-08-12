from rest_framework.response import Response
from rest_framework import status

ERROR_MESSAGES = {
    "VALIDATION_ERROR": "Validation failed.",
    "AUTH_FAILED": "Invalid username or password.",
    "NOT_FOUND": "Requested resource not found.",
    "SERVER_ERROR": "An unexpected error occurred. Please try again later."
}

def success_response(message, data=None, status_code=status.HTTP_200_OK):
    return Response(
        {
            "success": True,
            "message": message,
            "data": data if data else {}
        },
        status=status_code
    )

def error_response(message, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {
            "success": False,
            "message": message,
            "errors": errors if errors else {}
        },
        status=status_code
    )
