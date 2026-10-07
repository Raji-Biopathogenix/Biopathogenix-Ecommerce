from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0033_customuser_quickbook_customer_id")]

    operations = [
        migrations.AlterField(
            model_name="laboratory",
            name="name",
            field=models.CharField(max_length=255, unique=True),
        ),
    ]
