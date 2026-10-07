from django.db import migrations, transaction


def repair_laboratory_foreign_key(apps, schema_editor):
    connection = schema_editor.connection
    # The legacy repair migration changed this constraint only on MySQL.
    if connection.vendor != "mysql":
        return

    User = apps.get_model("users", "CustomUser")
    Laboratory = apps.get_model("users", "Laboratory")
    UserType = apps.get_model("users", "userTypes")
    database = connection.alias
    users = User.objects.using(database)
    labs = Laboratory.objects.using(database)
    table = User._meta.db_table
    column = User._meta.get_field("laboratory").column
    target_table = Laboratory._meta.db_table
    with connection.cursor() as cursor:
        constraints = connection.introspection.get_constraints(cursor, table)
    foreign_keys = {
        name: detail["foreign_key"]
        for name, detail in constraints.items()
        if detail.get("columns") == [column] and detail.get("foreign_key")
    }
    expected = (target_table, "id")
    for reference in foreign_keys.values():
        if reference not in (expected, (UserType._meta.db_table, "id")):
            raise RuntimeError("Unexpected laboratory foreign key; manual review required.")

    # Preserve assignments already pointing to valid Laboratory IDs. Restore
    # missing IDs from the legacy table, matching by name when that lab exists.
    missing_ids = list(
        users.filter(laboratory_id__isnull=False)
        .exclude(laboratory_id__in=labs.values("pk"))
        .values_list("laboratory_id", flat=True).distinct()
    )
    legacy_rows = {
        row.pk: row for row in UserType.objects.using(database).filter(pk__in=missing_ids)
    }
    if any(value not in legacy_rows for value in missing_ids):
        raise RuntimeError("A laboratory assignment has no matching legacy record; manual review required.")
    remaps = {}
    with transaction.atomic(using=database):
        for old_id in missing_ids:
            legacy = legacy_rows[old_id]
            lab = labs.filter(name__iexact=legacy.name).order_by("pk").first()
            if lab is None:
                lab = labs.create(pk=old_id, name=legacy.name)
                labs.filter(pk=lab.pk).update(created_at=legacy.created_at)
            if lab.pk != old_id:
                remaps[old_id] = lab.pk

    quote = schema_editor.quote_name
    for name, reference in foreign_keys.items():
        if reference != expected:
            schema_editor.execute(f"ALTER TABLE {quote(table)} DROP FOREIGN KEY {quote(name)}")
    with transaction.atomic(using=database):
        for old_id, new_id in remaps.items():
            users.filter(laboratory_id=old_id).update(laboratory_id=new_id)
    if expected not in foreign_keys.values():
        schema_editor.execute(
            f"ALTER TABLE {quote(table)} "
            f"ADD CONSTRAINT {quote('users_customuser_laboratory_fk_laboratories')} "
            f"FOREIGN KEY ({quote(column)}) REFERENCES {quote(target_table)} ({quote('id')})"
        )


class Migration(migrations.Migration):
    atomic = False
    dependencies = [("users", "0034_alter_laboratory_name")]
    operations = [
        migrations.RunPython(repair_laboratory_foreign_key, reverse_code=migrations.RunPython.noop),
    ]
