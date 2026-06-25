from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

from django.db import transaction

from .models import PathogenPanelLookup, normalize_lookup_text


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
WORKSHEET_REL_TYPE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
)


@dataclass
class PathogenLookupRow:
    pathogen_target: str
    normalized_name: str
    panels: list[str]
    panel_count: int
    source_sheet: str
    source_row: int


def _cell_text(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")

    if cell_type == "s":
        value = cell.find(f"{{{MAIN_NS}}}v")
        if value is None or value.text is None:
            return ""
        index = int(value.text)
        return shared_strings[index] if 0 <= index < len(shared_strings) else ""

    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(f".//{{{MAIN_NS}}}t"))

    value = cell.find(f"{{{MAIN_NS}}}v")
    return (value.text or "") if value is not None else ""


def _load_shared_strings(book: ZipFile) -> list[str]:
    try:
        with book.open("xl/sharedStrings.xml") as handle:
            root = ET.fromstring(handle.read())
    except KeyError:
        return []

    strings: list[str] = []
    for item in root.findall(f".//{{{MAIN_NS}}}si"):
        strings.append("".join(node.text or "" for node in item.findall(f".//{{{MAIN_NS}}}t")))
    return strings


def _resolve_sheet_path(book: ZipFile, sheet_name: str) -> str:
    with book.open("xl/workbook.xml") as handle:
        workbook = ET.fromstring(handle.read())
    with book.open("xl/_rels/workbook.xml.rels") as handle:
        relationships = ET.fromstring(handle.read())

    rel_id = None
    for sheet in workbook.findall(f".//{{{MAIN_NS}}}sheet"):
        if sheet.attrib.get("name") == sheet_name:
            rel_id = sheet.attrib.get(f"{{{OFFICE_REL_NS}}}id")
            break

    if not rel_id:
        raise ValueError(f"Sheet '{sheet_name}' was not found in the workbook.")

    for relationship in relationships.findall(f".//{{{PACKAGE_REL_NS}}}Relationship"):
        if relationship.attrib.get("Id") != rel_id:
            continue
        if relationship.attrib.get("Type") != WORKSHEET_REL_TYPE:
            continue
        target = relationship.attrib.get("Target", "")
        if target.startswith("/"):
            return target.lstrip("/")
        return f"xl/{target.lstrip('./')}"

    raise ValueError(f"Worksheet relationship '{rel_id}' was not found in the workbook.")


def _iter_sheet_rows(book: ZipFile, sheet_path: str, shared_strings: list[str]):
    with book.open(sheet_path) as handle:
        sheet = ET.fromstring(handle.read())

    for row in sheet.findall(f".//{{{MAIN_NS}}}sheetData/{{{MAIN_NS}}}row"):
        row_number = int(row.attrib.get("r", "0"))
        values: dict[str, str] = {}

        for cell in row.findall(f"{{{MAIN_NS}}}c"):
            cell_ref = cell.attrib.get("r", "")
            column = "".join(char for char in cell_ref if char.isalpha())
            if not column:
                continue
            values[column] = _cell_text(cell, shared_strings).replace("\xa0", " ").strip()

        yield row_number, values


def _parse_panels(panels_text: str) -> list[str]:
    return [panel.strip() for panel in panels_text.split(",") if panel.strip()]


def load_pathogen_lookup_rows_from_xlsx(
    xlsx_path: str | Path, sheet_name: str = "Pathogen Panel Lookup"
) -> list[PathogenLookupRow]:
    workbook_path = Path(xlsx_path)
    aggregated: dict[str, PathogenLookupRow] = {}

    with ZipFile(workbook_path) as book:
        shared_strings = _load_shared_strings(book)
        sheet_path = _resolve_sheet_path(book, sheet_name)

        for row_number, values in _iter_sheet_rows(book, sheet_path, shared_strings):
            if row_number < 4:
                continue

            pathogen_target = values.get("B", "").strip()
            if not pathogen_target:
                continue

            normalized_name = normalize_lookup_text(pathogen_target)
            if not normalized_name:
                continue

            panels = _parse_panels(values.get("D", ""))

            existing = aggregated.get(normalized_name)
            if existing is None:
                aggregated[normalized_name] = PathogenLookupRow(
                    pathogen_target=pathogen_target,
                    normalized_name=normalized_name,
                    panels=panels,
                    panel_count=len(panels),
                    source_sheet=sheet_name,
                    source_row=row_number,
                )
                continue

            for panel in panels:
                if panel not in existing.panels:
                    existing.panels.append(panel)
            existing.panel_count = len(existing.panels)

    return list(aggregated.values())


def sync_pathogen_lookup_from_xlsx(
    xlsx_path: str | Path, sheet_name: str = "Pathogen Panel Lookup"
) -> dict[str, int]:
    rows = load_pathogen_lookup_rows_from_xlsx(xlsx_path=xlsx_path, sheet_name=sheet_name)
    seen_names = {row.normalized_name for row in rows}
    created = 0
    updated = 0

    with transaction.atomic():
        for row in rows:
            _, was_created = PathogenPanelLookup.objects.update_or_create(
                normalized_name=row.normalized_name,
                defaults={
                    "pathogen_target": row.pathogen_target,
                    "panel_count": row.panel_count,
                    "panels": row.panels,
                    "source_sheet": row.source_sheet,
                    "source_row": row.source_row,
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        deleted, _ = PathogenPanelLookup.objects.exclude(normalized_name__in=seen_names).delete()

    return {
        "created": created,
        "updated": updated,
        "deleted": deleted,
        "total": len(rows),
    }
