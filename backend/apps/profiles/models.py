"""UserProfile model — one-to-one extension of the AUTH_USER_MODEL.

nimoh_base.privacy (and UserProfileBasicInline in the admin) requires a
dedicated profile model that holds a ForeignKey (or OneToOneField) pointing
at the custom User model.  This single model satisfies that contract.

Any profile data that doesn't belong directly on the User auth record
(privacy consents, notification preferences captured at a later step, etc.)
can be added here over time.
"""

import uuid

from django.conf import settings
from django.db import models
from nimoh_base.core.models import TimeStampedModel


class UserProfile(TimeStampedModel):
    """Thin profile record linked to the BookSwap User.

    Created automatically via a post_save signal on User so it always
    exists; callers can rely on ``user.profile`` without null-checking.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self) -> str:
        return f"Profile({self.user_id})"
