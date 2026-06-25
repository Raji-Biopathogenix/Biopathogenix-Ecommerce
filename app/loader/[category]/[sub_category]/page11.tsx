import Link from "next/link";
import { API_BASE_URL } from "@/config/env";
import { ProductsBySubCategoryResponse } from "@/types/product";
import ShopProductGrid from "@/components/category/ShopProductGrid";

type SectionProduct = {
  id: number;
  name: string;
  slug: string;
};

type GroupedSection = {
  id: number;
  name: string;
  slug: string;
  products: SectionProduct[];
};

type CategoryChildrenProductsResponse = {
  status: string;
  message: string;
  result?: {
    category: {
      id: number;
      name: string;
      slug: string;
    };
    sections: GroupedSection[];
  };
};

async function fetchProductsDataBySubCategory(
  category: string,
  subCategory: string
): Promise<ProductsBySubCategoryResponse | null> {
  const res = await fetch(`${API_BASE_URL}/v1/get-products-by-sub-category?category_slug=${category}&sub_category_slug=${subCategory}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  return res.json();
}

async function fetchCategoryChildrenProducts(
  subCategorySlug: string
): Promise<CategoryChildrenProductsResponse | null> {
  const res = await fetch(`${API_BASE_URL}/v1/category-children-products?category_slug=${subCategorySlug}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function SubCategoryPage({
  params,
}: {
  params: Promise<{ category: string; sub_category: string }>;
}) {
  const { category, sub_category } = await params;

  const [groupedRes, productsRes] = await Promise.all([
    fetchCategoryChildrenProducts(sub_category),
    fetchProductsDataBySubCategory(category, sub_category),
  ]);

  const sections = groupedRes?.result?.sections ?? [];
  const products = productsRes?.result?.data ?? [];


  console.log("SubCategory Page Result:", { groupedRes, productsRes });

  console.log("groupedRes?.result?.category?.name", groupedRes?.result?.category?.name)
  if (sections.length > 0) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 md:px-10 py-12 md:py-16">
        <h1
          className="text-[54px] md:text-[54px] leading-[1.04] font-bold text-[#10386b] mb-10 md:mb-12 tracking-[-0.03em]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {groupedRes?.result?.category?.name || sub_category.replace(/-/g, " ")}
        </h1>
        <div className="h-px bg-[#d7dee7] mb-12 md:mb-16" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-14">
          {sections.map((section) => (
            <section key={section.id}>
              <h2
                className="text-[19px] md:text-[19px] leading-[1.1] font-bold text-[#1F578D] mb-3 uppercase tracking-[0.02em]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {section.name}
              </h2>
              <p className="text-[#19457f]/55 text-sm md:text-base mb-5 font-medium">
                {section.products.length} product{section.products.length === 1 ? "" : "s"}
              </p>

              {section.products.length === 0 ? (
                <p className="text-gray-500">No products added yet.</p>
              ) : (
                <div className="flex flex-col gap-4 md:gap-5">
                  {section.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product-detail/${product.slug}`}
                      className="text-[#4d8fcd] text-[22px] md:text-[22px] leading-[1.14] font-normal underline decoration-[2px] underline-offset-[5px] hover:text-[#2f74b8]"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {product.name}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <ShopProductGrid products={products} />
    </div>
  );
}
