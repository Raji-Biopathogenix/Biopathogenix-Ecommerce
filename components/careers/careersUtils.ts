import { CareerOpenRole } from "@/lib/careers";

export function normalizeDepartmentKey(value: string) {
  return value.trim().toUpperCase();
}

export function roleAnchorId(roleId: number) {
  return `position-${roleId}`;
}

export function stripHtml(text?: string | null) {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function toPreviewText(text?: string | null, maxLength = 160) {
  const cleaned = stripHtml(text);
  if (!cleaned) return "";
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trimEnd()}...`;
}

export function sortRolesByOrder(roles: CareerOpenRole[]): CareerOpenRole[] {
  return [...roles].sort((a, b) => {
    const aSort = typeof a.sort_order === "number" ? a.sort_order : Number.MAX_SAFE_INTEGER;
    const bSort = typeof b.sort_order === "number" ? b.sort_order : Number.MAX_SAFE_INTEGER;
    if (aSort !== bSort) return aSort - bSort;
    return (a.title || "").localeCompare(b.title || "");
  });
}

export function filterRolesByDepartment(
  roles: CareerOpenRole[],
  selectedDepartment: string
): CareerOpenRole[] {
  if (normalizeDepartmentKey(selectedDepartment) === "ALL") {
    return roles;
  }
  return roles.filter(
    (role) =>
      normalizeDepartmentKey(role.department || "") ===
      normalizeDepartmentKey(selectedDepartment)
  );
}

export function getRoleActionHref(role: CareerOpenRole) {
  return role.slug ? `/about/careers/${role.slug}` : role.apply_url?.trim() || "#apply";
}
