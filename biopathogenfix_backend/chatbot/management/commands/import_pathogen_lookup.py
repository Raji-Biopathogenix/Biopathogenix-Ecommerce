from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from chatbot.pathogen_lookup_import import sync_pathogen_lookup_from_xlsx


class Command(BaseCommand):
    help = "Import the pathogen-to-panel lookup workbook into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "xlsx_path",
            type=str,
            help="Absolute or relative path to the Pathogen_Panel_Lookup.xlsx file.",
        )

    def handle(self, *args, **options):
        workbook_path = Path(options["xlsx_path"]).expanduser()
        if not workbook_path.is_absolute():
            workbook_path = Path.cwd() / workbook_path

        if not workbook_path.exists():
            raise CommandError(f"Workbook not found: {workbook_path}")

        summary = sync_pathogen_lookup_from_xlsx(workbook_path)
        self.stdout.write(
            self.style.SUCCESS(
                "Imported pathogen lookup workbook: "
                f"{summary['created']} created, "
                f"{summary['updated']} updated, "
                f"{summary['deleted']} deleted, "
                f"{summary['total']} total active rows."
            )
        )
