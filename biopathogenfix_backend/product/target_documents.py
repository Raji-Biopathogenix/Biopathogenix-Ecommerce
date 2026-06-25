import csv
import io
import posixpath
import re
import zipfile
import xml.etree.ElementTree as ET


XLSX_NAMESPACE = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkg_rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def get_file_extension(file_name):
    return file_name.rsplit(".", 1)[-1].lower() if file_name and "." in file_name else ""


def normalize_target_text(value):
    return re.sub(r"\s+", " ", value or "").strip()


def _column_index(cell_ref):
    letters = re.sub(r"[^A-Z]", "", (cell_ref or "").upper())
    index = 0
    for letter in letters:
        index = index * 26 + (ord(letter) - ord("A") + 1)
    return max(index - 1, 0)


def _xlsx_text(element):
    if element is None:
        return ""
    return "".join(element.itertext()).strip()


def extract_xlsx_rows(field_file, max_rows=5000, max_columns=30):
    with field_file.open("rb") as file_handle:
        with zipfile.ZipFile(file_handle) as archive:
            shared_strings = []
            if "xl/sharedStrings.xml" in archive.namelist():
                shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
                for item in shared_root.findall("main:si", XLSX_NAMESPACE):
                    shared_strings.append(_xlsx_text(item))

            workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
            first_sheet = workbook_root.find("main:sheets/main:sheet", XLSX_NAMESPACE)
            if first_sheet is None:
                return {"columns": [], "rows": [], "sheet_name": "Sheet 1", "truncated": False}

            sheet_name = first_sheet.attrib.get("name", "Sheet 1")
            rel_id = first_sheet.attrib.get(f"{{{XLSX_NAMESPACE['rel']}}}id")
            rels_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
            sheet_target = None
            for rel in rels_root.findall("pkg_rel:Relationship", XLSX_NAMESPACE):
                if rel.attrib.get("Id") == rel_id:
                    sheet_target = rel.attrib.get("Target")
                    break

            if not sheet_target:
                return {"columns": [], "rows": [], "sheet_name": sheet_name, "truncated": False}

            sheet_target = sheet_target.lstrip("/")
            sheet_path = posixpath.normpath(sheet_target if sheet_target.startswith("xl/") else posixpath.join("xl", sheet_target))
            sheet_root = ET.fromstring(archive.read(sheet_path))
            parsed_rows = []

            for row_element in sheet_root.findall(".//main:sheetData/main:row", XLSX_NAMESPACE):
                values = []
                for cell in row_element.findall("main:c", XLSX_NAMESPACE):
                    col_index = _column_index(cell.attrib.get("r", ""))
                    if col_index >= max_columns:
                        continue
                    while len(values) <= col_index:
                        values.append("")

                    value = ""
                    cell_type = cell.attrib.get("t")
                    if cell_type == "s":
                        raw_value = _xlsx_text(cell.find("main:v", XLSX_NAMESPACE))
                        if raw_value.isdigit() and int(raw_value) < len(shared_strings):
                            value = shared_strings[int(raw_value)]
                    elif cell_type == "inlineStr":
                        value = _xlsx_text(cell.find("main:is", XLSX_NAMESPACE))
                    else:
                        value = _xlsx_text(cell.find("main:v", XLSX_NAMESPACE))
                    values[col_index] = value

                while values and values[-1] == "":
                    values.pop()
                if any(values):
                    parsed_rows.append(values)
                if len(parsed_rows) > max_rows:
                    break

            if not parsed_rows:
                return {"columns": [], "rows": [], "sheet_name": sheet_name, "truncated": False}

            header_row = parsed_rows[0]
            column_total = max(len(row) for row in parsed_rows)
            columns = []
            for index in range(column_total):
                fallback = f"Column {index + 1}"
                label = header_row[index] if index < len(header_row) and header_row[index] else fallback
                columns.append(label)

            rows = []
            for row in parsed_rows[1:max_rows + 1]:
                rows.append(row + [""] * (column_total - len(row)))

            return {
                "columns": columns,
                "rows": rows,
                "sheet_name": sheet_name,
                "truncated": len(parsed_rows) > max_rows,
            }


def extract_target_text_from_file(field_file):
    if not field_file:
        return ""

    extension = get_file_extension(field_file.name)
    try:
        if extension == "xlsx":
            preview = extract_xlsx_rows(field_file)
            parts = preview["columns"][:]
            for row in preview["rows"]:
                parts.extend(row)
            return normalize_target_text(" ".join(parts))

        if extension == "csv":
            with field_file.open("rb") as file_handle:
                raw_text = file_handle.read().decode("utf-8", errors="ignore")
            reader = csv.reader(io.StringIO(raw_text))
            return normalize_target_text(" ".join(cell for row in reader for cell in row))
    except (KeyError, zipfile.BadZipFile, ET.ParseError, OSError):
        return ""

    return ""
