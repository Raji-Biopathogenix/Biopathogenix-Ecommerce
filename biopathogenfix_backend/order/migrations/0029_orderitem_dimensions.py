from django.db import migrations, models


WEIGHT_FIELD = models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10)
LENGTH_FIELD = models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10)
WIDTH_FIELD = models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10)
HEIGHT_FIELD = models.DecimalField(blank=True, decimal_places=2, default=0.0, max_digits=10)


def sync_orderitem_dimension_columns(apps, schema_editor):
    OrderItem = apps.get_model("order", "OrderItem")
    table_name = OrderItem._meta.db_table
    connection = schema_editor.connection
    field_map = {
        "weight": WEIGHT_FIELD,
        "length": LENGTH_FIELD,
        "width": WIDTH_FIELD,
        "height": HEIGHT_FIELD,
    }

    with connection.cursor() as cursor:
        existing_columns = {
            column.name for column in connection.introspection.get_table_description(cursor, table_name)
        }

    for field_name, field in field_map.items():
        if field_name in existing_columns:
            if connection.vendor == "sqlite":
                continue

            schema_editor.execute(
                f"ALTER TABLE `{table_name}` "
                f"MODIFY COLUMN `{field_name}` DECIMAL(10,2) NOT NULL DEFAULT 0.00"
            )
        else:
            if connection.vendor == "sqlite":
                schema_editor.add_field(OrderItem, field)
            else:
                schema_editor.execute(
                    f"ALTER TABLE `{table_name}` "
                    f"ADD COLUMN `{field_name}` DECIMAL(10,2) NOT NULL DEFAULT 0.00"
                )


class Migration(migrations.Migration):

    dependencies = [
        ("order", "0028_alter_order_status_alter_orderstatusupdate_status"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(sync_orderitem_dimension_columns, migrations.RunPython.noop),
            ],
            state_operations=[
                migrations.AddField(model_name="orderitem", name="weight", field=WEIGHT_FIELD),
                migrations.AddField(model_name="orderitem", name="length", field=LENGTH_FIELD),
                migrations.AddField(model_name="orderitem", name="width", field=WIDTH_FIELD),
                migrations.AddField(model_name="orderitem", name="height", field=HEIGHT_FIELD),
            ],
        ),
    ]
