"""Add explicit GiST index on User.location for spatial queries."""
from django.contrib.postgres.operations import BtreeGistExtension
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookswap', '0003_add_book_bookphoto_wishlistitem'),
    ]

    operations = [
        BtreeGistExtension(),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(
                fields=['location'],
                name='user_location_gist',
            ),
        ),
    ]
