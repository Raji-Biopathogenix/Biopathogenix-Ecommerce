from importlib import import_module
from unittest.mock import MagicMock

from django.apps import apps
from django.db import connection
from django.test import TransactionTestCase

from .models import CustomUser, Laboratory, userTypes

repair = import_module("users.migrations.0035_repair_laboratory_foreign_key").repair_laboratory_foreign_key


class LaboratoryForeignKeyRepairTests(TransactionTestCase):
    def editor(self, correct=False):
        editor = MagicMock()
        editor.connection.vendor = "mysql"
        editor.connection.alias = "default"
        editor.quote_name.side_effect = lambda value: f"`{value}`"
        editor.connection.introspection.get_constraints.return_value = {
            "old_fk": {
                "columns": ["laboratory_id"],
                "foreign_key": ("users_Laboratories" if correct else "users_userTypes", "id"),
            },
        }
        return editor

    def legacy_user(self, laboratory_id):
        with connection.constraint_checks_disabled():
            CustomUser.objects.bulk_create([
                CustomUser(email="legacy@example.com", laboratory_id=laboratory_id),
            ])
        return CustomUser.objects.get(email="legacy@example.com")

    def test_wrong_constraint_is_replaced_and_existing_assignment_preserved(self):
        lab = Laboratory.objects.create(name="Assigned Lab")
        user = CustomUser.objects.create_user(email="member@example.com", laboratory=lab)
        editor = self.editor()
        repair(apps, editor)
        user.refresh_from_db()
        self.assertEqual(user.laboratory_id, lab.pk)
        statements = [call.args[0] for call in editor.execute.call_args_list]
        self.assertIn("DROP FOREIGN KEY `old_fk`", statements[0])
        self.assertIn("REFERENCES `users_Laboratories` (`id`)", statements[1])

    def test_missing_lab_is_restored_from_legacy_record(self):
        legacy = userTypes.objects.create(id=500, name="Legacy Lab")
        user = self.legacy_user(legacy.pk)
        editor = self.editor()
        repair(apps, editor)
        user.refresh_from_db()
        self.assertEqual(user.laboratory_id, 500)
        self.assertEqual(user.laboratory.name, "Legacy Lab")
        connection.check_constraints()

    def test_existing_lab_name_is_reused_without_duplicate(self):
        lab = Laboratory.objects.create(name="Example Lab")
        legacy = userTypes.objects.create(id=500, name="example lab")
        user = self.legacy_user(legacy.pk)
        repair(apps, self.editor())
        user.refresh_from_db()
        self.assertEqual(user.laboratory_id, lab.pk)
        self.assertEqual(Laboratory.objects.count(), 1)
        connection.check_constraints()

    def test_correct_constraint_is_unchanged_on_repeat_run(self):
        editor = self.editor(correct=True)
        repair(apps, editor)
        repair(apps, editor)
        editor.execute.assert_not_called()

    def test_unresolvable_assignment_is_not_silently_deleted(self):
        user = self.legacy_user(500)
        editor = self.editor()
        with self.assertRaisesMessage(RuntimeError, "no matching legacy record"):
            repair(apps, editor)
        editor.execute.assert_not_called()
        user.refresh_from_db()
        self.assertEqual(user.laboratory_id, 500)
        CustomUser.objects.filter(pk=user.pk).update(laboratory_id=None)
