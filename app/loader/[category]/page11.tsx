import { API_BASE_URL } from "@/config/env";
import { HeaderMenus } from "@/types/header";
import { ProductsByCategoryResponse, Products } from "@/types/product";
import ShopProductGrid from "@/components/category/ShopProductGrid";

async function fetchHeaderMenus(): Promise<HeaderMenus | null> {
  const res = await fetch(`${API_BASE_URL}/v1/headermenu`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchProductsByCategory(category: string): Promise<Products[]> {
  const res = await fetch(`${API_BASE_URL}/v1/get-products-by-category?category_slug=${category}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const payload: ProductsByCategoryResponse = await res.json();
  return payload?.result?.data ?? [];
}

async function fetchProductsBySubCategory(category: string, subCategory: string): Promise<Products[]> {
  const res = await fetch(
    `${API_BASE_URL}/v1/get-products-by-sub-category?category_slug=${category}&sub_category_slug=${subCategory}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const payload: ProductsByCategoryResponse = await res.json();
  return payload?.result?.data ?? [];
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const menuRes = await fetchHeaderMenus();
  const menuItem = menuRes?.result?.data?.find((item) => item?.category?.slug === category);
  const categoryName = menuItem?.category?.name || category.replace(/-/g, " ").toUpperCase();
  const subCategories = menuItem?.category?.sub_categories ?? [];

  const directProducts = await fetchProductsByCategory(category);

  let products: Products[] = directProducts;
  if (subCategories.length > 0) {
    const subResults = await Promise.all(subCategories.map((sub) => fetchProductsBySubCategory(category, sub.slug)));
    const map = new Map<number, Products>();
    [...directProducts, ...subResults.flat()].forEach((item) => {
      map.set(item.id, item);
    });
    products = [...map.values()];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-[#0b2e59] mb-8">{categoryName}</h1>
      <ShopProductGrid products={products} />
    </div>
  );
}
