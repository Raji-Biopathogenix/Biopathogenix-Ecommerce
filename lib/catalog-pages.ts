import { notFound } from "next/navigation";
import { API_BASE_URL } from "@/config/env";

const RESERVED_CATEGORY_PATHS = new Set(["product-tag", "wp-admin", "wp-content", "wp-includes", "wp-json"]);

export function isCatalogSlug(value: string): boolean {
  return /^[a-z0-9_-]{1,255}$/i.test(value) && !RESERVED_CATEGORY_PATHS.has(value.toLowerCase());
}

export async function fetchCatalogPage<T>(
  endpoint: string,
  parameters: Record<string, string | number>,
  revalidate?: number,
): Promise<T> {
  for (const key of ["category_slug", "sub_category_slug"]) {
    if (parameters[key] !== undefined && !isCatalogSlug(String(parameters[key]))) notFound();
  }
  const query = new URLSearchParams(
    Object.entries(parameters).map(([key, value]) => [key, String(value)]),
  );
  const response = await fetch(`${API_BASE_URL}/v1/products/${endpoint}/?${query}`, {
    ...(revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate } }),
  });
  if (response.status === 404) notFound();
  // Service failures should reach the error boundary, not be cached as missing pages.
  if (!response.ok) throw new Error("Unable to load the product catalog. Please try again shortly.");
  const payload = await response.json();
  if (!payload?.result?.category || (parameters.sub_category_slug && !payload.result.subCategory)) notFound();
  return payload.result as T;
}
