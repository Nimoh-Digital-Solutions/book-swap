from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("books", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="book",
            name="is_seed",
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text="Seed/demo book — always shown in browse regardless of the requesting user's location.",
            ),
        ),
    ]
