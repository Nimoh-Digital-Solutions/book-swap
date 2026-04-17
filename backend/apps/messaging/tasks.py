"""Celery tasks for the messaging app."""

import logging

from celery import shared_task
from django.contrib.gis.geos import Point

logger = logging.getLogger(__name__)

MAX_PER_CATEGORY = 20


@shared_task(
    name="messaging.populate_meetup_locations",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    acks_late=True,
)
def populate_meetup_locations(self, latitude: float, longitude: float):
    """Query Overpass API for nearby POIs and create MeetupLocation records.

    Fired asynchronously after a user sets their location. Uses
    get_or_create on (name, city) to avoid duplicates.
    """
    from bookswap.services import OverpassPOIService

    from .models import MeetupLocation

    try:
        pois = OverpassPOIService.find_nearby(latitude, longitude, radius_m=5000)
    except Exception as exc:
        logger.warning("Overpass query failed for (%.4f, %.4f): %s", latitude, longitude, exc)
        raise self.retry(exc=exc) from exc

    if not pois:
        logger.info("No POIs found near (%.4f, %.4f)", latitude, longitude)
        return 0

    category_counts: dict[str, int] = {}
    created_count = 0

    for poi in pois:
        cat = poi["category"]
        if category_counts.get(cat, 0) >= MAX_PER_CATEGORY:
            continue

        _, created = MeetupLocation.objects.get_or_create(
            name=poi["name"],
            city=poi["city"],
            defaults={
                "address": poi["address"],
                "category": cat,
                "location": Point(poi["lng"], poi["lat"], srid=4326),
                "is_active": True,
            },
        )

        category_counts[cat] = category_counts.get(cat, 0) + 1
        if created:
            created_count += 1

    logger.info(
        "Populated %d new meetup locations near (%.4f, %.4f) from %d POIs",
        created_count,
        latitude,
        longitude,
        len(pois),
    )
    return created_count
