"""
Messaging models — Message for chat and MeetupLocation for meetup suggestions.

Provides the data layer for real-time chat between exchange partners (US-601)
and curated meetup location suggestions (US-602).
"""
import uuid

from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.core.exceptions import ValidationError
from django.db import models
from nimoh_base.core.models import TimeStampedModel


class Message(TimeStampedModel):
    """A chat message between two exchange partners."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    exchange = models.ForeignKey(
        'exchanges.ExchangeRequest',
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    content = models.TextField(
        blank=True,
        help_text='Message text (max 1000 characters).',
    )
    image = models.ImageField(
        upload_to='chat_images/',
        blank=True,
        null=True,
        help_text='Optional image attachment (JPEG/PNG, max 5 MB).',
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Set when the recipient opens the chat and this message is visible.',
    )

    class Meta:
        ordering = ['created_at']  # noqa: RUF012
        indexes = [  # noqa: RUF012
            models.Index(
                fields=['exchange', 'created_at'],
                name='msg_exchange_created',
            ),
            models.Index(
                fields=['sender', 'created_at'],
                name='msg_sender_created',
            ),
        ]

    def __str__(self):
        preview = (self.content[:40] + '…') if len(self.content) > 40 else self.content
        return f'Message {self.id!s:.8} by {self.sender} — "{preview}"'

    def clean(self):
        super().clean()
        if not self.content and not self.image:
            raise ValidationError(
                'A message must have either text content or an image.'
            )
        if self.content and len(self.content) > 1000:
            raise ValidationError(
                'Message content must be at most 1000 characters.'
            )


class MeetupCategory(models.TextChoices):
    LIBRARY = 'library', 'Library'
    CAFE = 'cafe', 'Cafe'
    PARK = 'park', 'Park'
    STATION = 'station', 'Train Station'


class MeetupLocation(models.Model):
    """A curated public meetup location for exchange partners to meet."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    category = models.CharField(
        max_length=30,
        choices=MeetupCategory.choices,
    )
    location = gis_models.PointField(srid=4326)
    city = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']  # noqa: RUF012
        indexes = [  # noqa: RUF012
            models.Index(
                fields=['category', 'is_active'],
                name='meetup_cat_active',
            ),
        ]

    def __str__(self):
        return f'{self.name} ({self.get_category_display()}) — {self.city}'
