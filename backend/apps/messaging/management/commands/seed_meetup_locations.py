"""Seed curated Amsterdam meetup locations for exchange partners."""
from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from apps.messaging.models import MeetupCategory, MeetupLocation

LOCATIONS = [
    # Libraries
    ('OBA Oosterdok', 'Oosterdokskade 143, 1011 DL', MeetupCategory.LIBRARY, 'Amsterdam', 4.9025, 52.3762),
    ('OBA Javaplein', 'Javaplein 2, 1095 CJ', MeetupCategory.LIBRARY, 'Amsterdam', 4.9423, 52.3616),
    ('OBA De Hallen', 'Hannie Dankbaarpassage 33, 1053 RT', MeetupCategory.LIBRARY, 'Amsterdam', 4.8610, 52.3630),
    ('OBA Bos en Lommer', 'Bos en Lommerplein 176, 1055 EK', MeetupCategory.LIBRARY, 'Amsterdam', 4.8505, 52.3750),
    ('OBA Reigersbos', 'Reigersbos 3, 1107 AS', MeetupCategory.LIBRARY, 'Amsterdam', 4.9680, 52.3130),
    # Cafes
    ('Coffee Company Leidseplein', 'Leidseplein 1, 1017 PR', MeetupCategory.CAFE, 'Amsterdam', 4.8828, 52.3641),
    ('Starbucks Centraal Station', 'Stationsplein 10, 1012 AB', MeetupCategory.CAFE, 'Amsterdam', 4.9005, 52.3791),
    ('Bagels & Beans Waterlooplein', 'Jodenbreestraat 8, 1011 NK', MeetupCategory.CAFE, 'Amsterdam', 4.9010, 52.3687),
    ('Coffee Company Vondelpark', 'Vondelstraat 47, 1054 GH', MeetupCategory.CAFE, 'Amsterdam', 4.8767, 52.3597),
    ('Café De Jaren', 'Nieuwe Doelenstraat 20, 1012 CP', MeetupCategory.CAFE, 'Amsterdam', 4.8960, 52.3670),
    # Parks
    ('Vondelpark (main entrance)', 'Stadhouderskade, 1054 ES', MeetupCategory.PARK, 'Amsterdam', 4.8779, 52.3580),
    ('Westerpark', 'Haarlemmerweg 8-10, 1014 BE', MeetupCategory.PARK, 'Amsterdam', 4.8740, 52.3870),
    ('Sarphatipark', 'Sarphatipark, 1073 CZ', MeetupCategory.PARK, 'Amsterdam', 4.8935, 52.3547),
    ('Oosterpark', 'Oosterpark, 1092 AE', MeetupCategory.PARK, 'Amsterdam', 4.9220, 52.3600),
    ('Rembrandtpark', 'Rembrandtpark, 1054 EW', MeetupCategory.PARK, 'Amsterdam', 4.8510, 52.3600),
    # Stations
    ('Amsterdam Centraal', 'Stationsplein 9, 1012 AB', MeetupCategory.STATION, 'Amsterdam', 4.9003, 52.3791),
    ('Amsterdam Amstel', 'Julianaplein 1, 1097 DN', MeetupCategory.STATION, 'Amsterdam', 4.9174, 52.3464),
    ('Amsterdam Sloterdijk', 'Orlyplein 1, 1043 DP', MeetupCategory.STATION, 'Amsterdam', 4.8382, 52.3890),
    ('Amsterdam Zuid', 'Arnold Schönberglaan 7, 1082 MJ', MeetupCategory.STATION, 'Amsterdam', 4.8729, 52.3389),
    ('Amsterdam Science Park', 'Carolina MacGillavrylaan, 1098 XH', MeetupCategory.STATION, 'Amsterdam', 4.9480, 52.3527),
]


class Command(BaseCommand):
    help = 'Seed curated Amsterdam meetup locations for book exchange partners.'

    def handle(self, *args, **options):
        created_count = 0
        for name, address, category, city, lng, lat in LOCATIONS:
            _, created = MeetupLocation.objects.get_or_create(
                name=name,
                defaults={
                    'address': address,
                    'category': category,
                    'city': city,
                    'location': Point(lng, lat, srid=4326),
                    'is_active': True,
                },
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {created_count} new meetup locations '
                f'({MeetupLocation.objects.count()} total).'
            )
        )
