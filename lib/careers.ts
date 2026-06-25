import { API_BASE_URL } from "@/config/env";

export type CareerOpenRole = {
  id: number;
  title: string;
  slug?: string | null;
  department?: string;
  location?: string;
  short_description?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  salary_range?: string;
  employment_type?: string;
  apply_url?: string;
  sort_order?: number;
};

export type CareerOpenRolesData = {
  departments: string[];
  roles: CareerOpenRole[];
};

type OpenRolesApiResponse = {
  status?: string;
  message?: string;
  result?: {
    departments?: string[];
    data?: CareerOpenRole[];
  };
};

type OpenRoleDetailApiResponse = {
  status?: string;
  message?: string;
  result?: {
    data?: CareerOpenRole;
  };
};

export const OPEN_ROLES_FALLBACK: CareerOpenRole[] = [
  { id: 1, title: "ADMINISTRATION", slug: "administration" },
  { id: 2, title: "RESEARCH & DEVELOPMENT", slug: "research-development" },
  { id: 3, title: "FINANCE/ACCOUNTING", slug: "finance-accounting" },
  { id: 4, title: "OPERATIONS", slug: "operations" },
  { id: 5, title: "TECHNICAL", slug: "technical" },
  { id: 6, title: "REGULATORY AFFAIRS", slug: "regulatory-affairs" },
];

export const CAREER_DEPARTMENTS_FALLBACK = [
  "ADMINISTRATION",
  "RESEARCH & DEVELOPMENT",
  "FINANCE/ACCOUNTING",
  "OPERATIONS",
  "TECHNICAL",
  "REGULATORY AFFAIRS",
];

export async function fetchOpenRolesData(): Promise<CareerOpenRolesData> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/open-roles/`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        departments: CAREER_DEPARTMENTS_FALLBACK,
        roles: OPEN_ROLES_FALLBACK,
      };
    }

    const payload = (await response.json()) as OpenRolesApiResponse;
    const departments = payload?.result?.departments;
    const roles = payload?.result?.data;

    return {
      departments:
        Array.isArray(departments) && departments.length
          ? departments
          : CAREER_DEPARTMENTS_FALLBACK,
      roles: Array.isArray(roles) ? roles : OPEN_ROLES_FALLBACK,
    };
  } catch {
    return {
      departments: CAREER_DEPARTMENTS_FALLBACK,
      roles: OPEN_ROLES_FALLBACK,
    };
  }
}

export async function fetchOpenRoles(): Promise<CareerOpenRole[]> {
  const payload = await fetchOpenRolesData();
  return payload.roles;
}

export async function fetchOpenRoleBySlug(slug: string): Promise<CareerOpenRole | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/open-roles/${encodeURIComponent(slug)}/`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as OpenRoleDetailApiResponse;
    return payload?.result?.data ?? null;
  } catch {
    return null;
  }
}

type CareerApplyResponse = {
  status?: string;
  message?: string;
};

export async function submitCareerApplication(formData: FormData): Promise<CareerApplyResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/career-applications/`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as CareerApplyResponse;
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to submit application.");
  }

  return payload;
}
