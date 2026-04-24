"""Notification task for account lifecycle events (e.g. deletion confirmation)."""

import logging

from celery import shared_task

from ._helpers import _frontend_url, _send_direct_email

logger = logging.getLogger(__name__)


@shared_task(name="notifications.send_account_deletion_email")
def send_account_deletion_email(user_id: str, cancel_token: str) -> None:
    """Send a confirmation email when account deletion is requested."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.warning("send_account_deletion_email: user %s not found.", user_id)
        return

    fe_url = _frontend_url()
    cancel_url = f"{fe_url}/account/cancel-deletion?token={cancel_token}"

    _send_direct_email(
        user=user,
        subject="BookSwap: Your account is scheduled for deletion",
        body_text=(
            f"Hi {user.username},\n\n"
            "We received your request to delete your BookSwap account. "
            "Your account has been deactivated and will be permanently deleted in 30 days.\n\n"
            "During this period, you can cancel the deletion by visiting:\n"
            f"{cancel_url}\n\n"
            "What will be deleted:\n"
            "- Your profile information (name, email, location)\n"
            "- All your book listings\n"
            "- Exchange history and messages\n"
            "- Ratings and reviews\n"
            "- Push notification tokens and preferences\n\n"
            "If you did not request this, please cancel immediately using the link above "
            "and change your password.\n\n"
            "The BookSwap Team"
        ),
        cta_url=cancel_url,
        cta_text="Cancel Deletion",
        body_html=(
            "We received your request to delete your BookSwap account. "
            "Your account has been deactivated and will be <strong>permanently deleted in 30 days</strong>."
            "<br><br>"
            "During this period, you can cancel the deletion at any time."
            '<br><br><strong style="color:#1a2f23;">What will be deleted:</strong>'
            "<br>&#8226; Your profile information (name, email, location)"
            "<br>&#8226; All your book listings"
            "<br>&#8226; Exchange history and messages"
            "<br>&#8226; Ratings and reviews"
            "<br>&#8226; Push notification tokens and preferences"
            "<br><br>"
            '<span style="color:#c0392b;">If you did not request this, please cancel immediately '
            "and change your password.</span>"
        ),
    )
    logger.info("Account deletion confirmation email sent to user %s.", user_id)
