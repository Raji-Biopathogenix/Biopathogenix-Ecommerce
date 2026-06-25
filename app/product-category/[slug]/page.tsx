import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import ShopProductGrid from "@/components/shop/ShopProductGrid";
import { fetchProducts } from "@/lib/products";
import { CATEGORY_FALLBACK, CATEGORY_ORDER, fetchCategories, getCategoryImage, sortCategories } from "@/lib/categories";
import { getEffectiveProductPrice } from "@/lib/productPricing";

const FALLBACK_IMAGE = "/images/shop/96-Well-PCR-Plate-1-scaled.jpg";

export const dynamic = "force-dynamic";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "quality-control") {
    redirect("/quality-control");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // Fetch categories and products in parallel instead of sequentially
  const [categories, { items, total }] = await Promise.all([
    fetchCategories(),
    fetchProducts({ categorySlug: slug, accessToken: token }),
  ]);

  const sortedCategories = sortCategories(categories.length ? categories : CATEGORY_FALLBACK);
  const activeCategory = sortedCategories.find((category) => category.slug === slug);

  if (!activeCategory) {
    notFound();
  }
  const products = items.map((item) => {
    const price = getEffectiveProductPrice(item);
    const comparePrice = item.compare_price ? Number(item.compare_price) : 0;
    return {
      id: item.id,
      title: item.name,
      image: item.primary_image?.image_url || FALLBACK_IMAGE,
      price,
      originalPrice: comparePrice,
      category: item.category_name || activeCategory.name,
      is_customizable: item.is_customizable,
      prd_customization_prices: item.prd_customization_prices
        ? { price: Number(item.prd_customization_prices.price) }
        : null,
    };
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[#f8fafd] py-20 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-4">
            <div
              className="h-12 w-12 rounded-xl bg-white shadow-sm bg-cover bg-center"
              style={{ backgroundImage: `url(${getCategoryImage(activeCategory.slug, activeCategory.icon)})` }}
            />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#0b2e59]/60">Category</p>
              <h1 className="text-[44px] font-bold text-[#0b2e59]">
                {activeCategory.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800">
            SHOWING 1-{products.length} OF {total || products.length} RESULTS
          </h2>
          <Link href="/shop" className="text-sm font-semibold text-[#0b76d1] hover:text-[#0b2e59]">
            View all products
          </Link>
        </div>

        {products.length ? (
          <ShopProductGrid products={products} />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-[#0b2e59]">No products yet</p>
            <p className="mt-2 text-sm text-gray-500">
              Add products to this category in the admin and they will show here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
