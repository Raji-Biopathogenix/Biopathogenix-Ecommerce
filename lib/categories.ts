import { API_BASE_URL } from "@/config/env";

export type Category = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CategoryApiResponse = {
  status: string;
  data?: Category[];
  message?: string;
};

export const CATEGORY_ORDER = [
  "pcr-kits-panels",
  "extraction-sample-prep",
  "controls-standards",
  "quality-control",
  "consumable-and-lab-supplies",
  "ppe",
  "new-arrivals",
];

export const CATEGORY_LABELS: Record<string, string> = {
  "pcr-kits-panels": "PCR Kits & Panels",
  "extraction-sample-prep": "Extraction & Sample Prep",
  "controls-standards": "Controls & Standards",
  "quality-control": "Quality Control",
  "consumable-and-lab-supplies": "Consumable and Lab Supplies",
  ppe: "PPE",
  "new-arrivals": "New Arrivals",
};

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "pcr-kits-panels": "/images/menu/pcr-reagents.png",
  "extraction-sample-prep": "/images/menu/dna-rna-extraction.png",
  "controls-standards": "/images/menu/quality-control.png",
  "quality-control": "/images/menu/quality-control.png",
  "consumable-and-lab-supplies": "/images/menu/pcr-lab-consumables.png",
  ppe: "/images/menu/ppe.png",
  "new-arrivals": "/images/menu/collection-supplies.png",
  "all-products": "/images/menu/collection-supplies.png",
  default: "/images/menu/collection-supplies.png",
};

export const CATEGORY_FALLBACK: Category[] = CATEGORY_ORDER.map((slug, index) => ({
  id: index + 1,
  name: CATEGORY_LABELS[slug],
  slug,
  icon: null,
  is_active: true,
  created_at: "",
  updated_at: "",
}));

export function sortCategories(categories: Category[]): Category[] {
  const orderIndex = new Map(CATEGORY_ORDER.map((slug, index) => [slug, index]));
  return [...categories].sort((a, b) => {
    const aIndex = orderIndex.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex === bIndex) {
      return a.name.localeCompare(b.name);
    }
    return aIndex - bIndex;
  });
}

export function getCategoryImage(slug: string, icon?: string | null): string {
  if (icon) {
    return icon;
  }
  return CATEGORY_IMAGE_MAP[slug] ?? CATEGORY_IMAGE_MAP.default;
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/categories/`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as CategoryApiResponse;
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return [];
  }
}
