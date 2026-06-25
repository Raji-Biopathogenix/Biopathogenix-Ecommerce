CAREER_DEPARTMENTS = [
    "ADMINISTRATION",
    "RESEARCH & DEVELOPMENT",
    "FINANCE/ACCOUNTING",
    "OPERATIONS",
    "TECHNICAL",
    "REGULATORY AFFAIRS",
]


def normalize_department(value: str) -> str:
    incoming = (value or "").strip()
    if not incoming:
        return ""

    upper_map = {department.upper(): department for department in CAREER_DEPARTMENTS}
    return upper_map.get(incoming.upper(), incoming)
