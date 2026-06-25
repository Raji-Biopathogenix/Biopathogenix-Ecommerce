import { API_BASE_URL } from "@/config/env";

export type ProductImage = {
  id: number;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
};

export type ProductListItem = {
  id: number;
  name: string;
  slug: string;
  category_name: string;
  category_slug?: string;
  sku: string;
  price: number | string;
  compare_price: number | string | null;
  discount_percentage: number;
  primary_image: ProductImage | null;
  is_customizable?: boolean;
  prd_customization_prices?: {
    price: number;
  } | null;
};

export type ProductListResult = {
  items: ProductListItem[];
  total: number;
};


export async function fetchProducts(params: {
  featured?: boolean;
  pageSize?: number;
  categorySlug?: string;
  accessToken?: string;
} = {}): Promise<ProductListResult> {
  const EMPTY_RESULT: ProductListResult = { items: [], total: 0 };
  const url = new URL(`${API_BASE_URL}/v1/products/`);

  if (params.featured) {
    url.searchParams.set("is_featured", "true");
  }

  if (params.pageSize) {
    url.searchParams.set("page_size", String(params.pageSize));
  }

  if (params.categorySlug) {
    url.searchParams.set("category_slug", params.categorySlug);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: params.accessToken
        ? {
            Authorization: `Bearer ${params.accessToken}`,
          }
        : undefined,
      // Cache public (non-auth) product lists for 60s; bypass cache for logged-in users
      ...(params.accessToken
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
    });

    if (!response.ok) {
      return EMPTY_RESULT;
    }

    const payload = (await response.json()) as ProductListResult;
    return {
      items: Array.isArray(payload?.items) ? payload.items : [],
      total: typeof payload?.total === "number" ? payload.total : 0,
    };
  } catch {
    return EMPTY_RESULT;
  }
}
