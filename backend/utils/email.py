import logging
from django.core.mail import EmailMessage
from django.conf import settings

def send_mail(subject: str, message: str, recipient_list: list, from_email: str = None, attachments=None, html_message=None):
    """
    Send an email with optional HTML content and attachments.

    Args:
        subject (str): Email subject.
        message (str): Plain text email body.
        recipient_list (list): List of recipient email addresses.
        from_email (str, optional): Sender email address. Defaults to settings.DEFAULT_FROM_EMAIL or EMAIL_HOST_USER.
        attachments (list, optional): List of tuples (filename, content, mimetype).
        html_message (str, optional): HTML email body.

    Returns:
        dict: {'isSuccess': bool, 'data': str, 'error': str or None}
    """
    if from_email is None:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', None)

    if not from_email:
        err_msg = "No from_email specified and no DEFAULT_FROM_EMAIL or EMAIL_HOST_USER set in settings."
        return {"isSuccess": False, "data": None, "error": err_msg}

    if not recipient_list:
        err_msg = "Recipient list is empty."
        return {"isSuccess": False, "data": None, "error": err_msg}

    try:
        email = EmailMessage(
            subject=subject,
            body=message,
            from_email=from_email,
            to=recipient_list
        )

        if html_message:
            email.content_subtype = 'html'
            email.body = html_message

        if attachments:
            for attachment in attachments:
                email.attach(*attachment)

        email.send(fail_silently=False)
        return {"isSuccess": True, "data": "Email sent successfully.", "error": None}
    except Exception as e:
        return {"isSuccess": False, "data": None, "error": str(e)}
