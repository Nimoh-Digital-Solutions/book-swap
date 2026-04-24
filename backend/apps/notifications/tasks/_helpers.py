"""Shared helpers for notification Celery tasks (AUD-B-303).

Every task creates an in-app ``Notification``, fans out a WS push, fires
device pushes via Expo, and conditionally sends a branded email subject
to the recipient's preferences. These helpers keep that boilerplate out
of the per-event task modules.
"""

import logging

from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

# Default window for new-message email batching (seconds).
_MSG_BATCH_TTL = 60 * 15  # 15 minutes


def _frontend_url() -> str:
    from django.conf import settings

    return getattr(settings, "FRONTEND_URL", "https://bookswap.app").rstrip("/")


def _push_to_devices(user, title: str, body: str, data: dict | None = None) -> None:
    """Send Expo push notifications to all of a user's registered devices."""
    try:
        from exponent_server_sdk import (
            DeviceNotRegisteredError,
            PushClient,
            PushMessage,
        )

        from ..models import MobileDevice

        tokens = list(MobileDevice.objects.filter(user=user, is_active=True).values_list("push_token", flat=True))
        if not tokens:
            return

        client = PushClient()
        messages = [PushMessage(to=token, title=title, body=body, data=data or {}, sound="default") for token in tokens]
        responses = client.publish_multiple(messages)
        for token, response in zip(tokens, responses, strict=False):
            try:
                response.validate_response()
            except DeviceNotRegisteredError:
                MobileDevice.objects.filter(push_token=token).update(is_active=False)
                logger.info("Deactivated stale push token: %s", token[:20])
            except Exception as exc:
                logger.warning("Push error for token %s: %s", token[:20], exc)
    except ImportError:
        logger.debug("exponent_server_sdk not installed — skipping device push.")
    except Exception as exc:
        logger.warning("Device push failed for user %s: %s", user.pk, exc)


def _push_to_ws(user_id: str, payload: dict) -> None:
    """Fire-and-forget push to the user's notification WS group."""
    try:
        from channels.layers import get_channel_layer

        layer = get_channel_layer()
        if layer is None:
            return
        async_to_sync(layer.group_send)(
            f"notifications_{user_id}",
            {"type": "notification.push", "notification": payload},
        )
    except Exception as exc:
        logger.warning("WS push failed for user %s: %s", user_id, exc)


def _create_notification(user, notification_type: str, title: str, body: str, link: str = ""):
    """Persist an in-app notification and return it."""
    from ..models import Notification

    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        body=body,
        link=link,
    )


def _maybe_send_email(
    user,
    subject: str,
    body_text: str,
    prefs_field: str,
    *,
    cta_url: str = "",
    cta_text: str = "",
    body_html: str = "",
) -> None:
    """Send a branded HTML + plain-text email if the user has opted in."""
    from django.conf import settings
    from django.core.mail import EmailMultiAlternatives
    from django.template.loader import render_to_string

    from ..models import NotificationPreferences

    prefs, _ = NotificationPreferences.objects.get_or_create(user=user)
    if not getattr(prefs, prefs_field, True):
        logger.debug("Email suppressed for %s (user %s opted out).", prefs_field, user.pk)
        return

    fe_url = _frontend_url()
    unsub_url = f"{fe_url}/notifications/unsubscribe/{prefs.unsubscribe_token}"
    plain_body = f"{body_text}\n\n---\nManage your email preferences: {unsub_url}"

    html_body = render_to_string(
        "emails/notifications/notification.html",
        {
            "subject": subject,
            "recipient_name": user.get_full_name() or user.username,
            "body_text": body_text,
            "body_html": body_html or body_text,
            "cta_url": cta_url,
            "cta_text": cta_text,
            "unsubscribe_url": unsub_url,
            "frontend_url": fe_url,
        },
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        # AUD-B-603: log user PK rather than the raw email address; the user
        # record is enough to correlate but doesn't leak PII into central logs.
        logger.info("Notification email (%s) sent to user %s.", prefs_field, user.pk)
    except Exception as exc:
        logger.warning("Email send failed (%s → user %s): %s", prefs_field, user.pk, exc)


def _notification_payload(notification) -> dict:
    return {
        "id": str(notification.pk),
        "notification_type": notification.notification_type,
        "title": notification.title,
        "body": notification.body,
        "link": notification.link,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(),
    }


def _send_direct_email(
    user,
    subject: str,
    body_text: str,
    *,
    cta_url: str = "",
    cta_text: str = "",
    body_html: str = "",
) -> None:
    """Send a branded email directly (no preference check — always sent)."""
    from django.conf import settings
    from django.core.mail import EmailMultiAlternatives
    from django.template.loader import render_to_string

    fe_url = _frontend_url()
    html_body = render_to_string(
        "emails/notifications/notification.html",
        {
            "subject": subject,
            "recipient_name": user.get_full_name() or user.username,
            "body_text": body_text,
            "body_html": body_html or body_text,
            "cta_url": cta_url,
            "cta_text": cta_text,
            "frontend_url": fe_url,
        },
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        # AUD-B-603: log user PK rather than raw email (see also above).
        logger.info("Direct email sent to user %s: %s", user.pk, subject)
    except Exception as exc:
        logger.warning("Direct email send failed (user %s): %s", user.pk, exc)
