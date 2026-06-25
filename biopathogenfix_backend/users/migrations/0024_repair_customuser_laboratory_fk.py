from django.db import migrations


def repair_customuser_laboratory_fk(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor == "sqlite":
        return

    customuser_table = "users_customuser"
    usertypes_table = "users_userTypes"
    legacy_table = "users_Laboratories"
    expected_ref_table = usertypes_table
    new_constraint_name = "users_customuser_laboratory_fk_usertypes"

    with connection.cursor() as cursor:
        table_names = set(connection.introspection.table_names(cursor))
        if customuser_table not in table_names or usertypes_table not in table_names:
            return

        if legacy_table in table_names:
            cursor.execute(
                f"""
                SELECT DISTINCT cu.laboratory_id
                FROM {customuser_table} cu
                LEFT JOIN {usertypes_table} ut ON ut.id = cu.laboratory_id
                WHERE cu.laboratory_id IS NOT NULL AND ut.id IS NULL
                """
            )
            missing_usertype_ids = [row[0] for row in cursor.fetchall()]

            if missing_usertype_ids:
                id_list = ", ".join(str(int(value)) for value in missing_usertype_ids)
                cursor.execute(
                    f"""
                    SELECT id, name, created_at
                    FROM {legacy_table}
                    WHERE id IN ({id_list})
                    """
                )
                legacy_rows = {row[0]: row[1:] for row in cursor.fetchall()}

                for missing_id in missing_usertype_ids:
                    legacy_row = legacy_rows.get(missing_id)
                    if legacy_row is None:
                        cursor.execute(
                            f"""
                            UPDATE {customuser_table}
                            SET laboratory_id = NULL
                            WHERE laboratory_id = %s
                            """,
                            [missing_id],
                        )
                        continue

                    name, created_at = legacy_row
                    cursor.execute(
                        f"""
                        INSERT INTO {usertypes_table} (id, name, created_at, is_displayed)
                        VALUES (%s, %s, %s, %s)
                        """,
                        [missing_id, name, created_at, True],
                    )

        cursor.execute(
            """
            SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = %s
              AND COLUMN_NAME = %s
              AND REFERENCED_TABLE_NAME IS NOT NULL
            """,
            [customuser_table, "laboratory_id"],
        )
        constraints = cursor.fetchall()

        has_expected_constraint = any(
            referenced_table == expected_ref_table
            for _, referenced_table in constraints
        )

        for constraint_name, referenced_table in constraints:
            if referenced_table != expected_ref_table:
                schema_editor.execute(
                    f"ALTER TABLE `{customuser_table}` DROP FOREIGN KEY `{constraint_name}`"
                )

        if not has_expected_constraint:
            schema_editor.execute(
                f"""
                ALTER TABLE `{customuser_table}`
                ADD CONSTRAINT `{new_constraint_name}`
                FOREIGN KEY (`laboratory_id`) REFERENCES `{expected_ref_table}` (`id`)
                """
            )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("users", "0023_repair_usertypes_is_displayed"),
    ]

    operations = [
        migrations.RunPython(
            repair_customuser_laboratory_fk,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
