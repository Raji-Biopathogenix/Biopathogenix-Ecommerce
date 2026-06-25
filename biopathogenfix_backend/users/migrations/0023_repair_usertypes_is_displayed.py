from django.db import migrations


def add_missing_is_displayed(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor == "sqlite":
        return

    table_name = "users_userTypes"

    with connection.cursor() as cursor:
        table_names = set(connection.introspection.table_names(cursor))
        if table_name not in table_names:
            return

        columns = {
            column.name
            for column in connection.introspection.get_table_description(cursor, table_name)
        }

    if "is_displayed" in columns:
        return

    user_types = apps.get_model("users", "userTypes")
    field = user_types._meta.get_field("is_displayed")
    schema_editor.add_field(user_types, field)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("users", "0022_customuser_laboratory"),
    ]

    operations = [
        migrations.RunPython(
            add_missing_is_displayed,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
