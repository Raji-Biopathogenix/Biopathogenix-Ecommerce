import { API_BASE_URL } from "@/config/env";
import { ProductsByCategoryResponse, CategoryResponse,ProductResponse } from "@/types/product";
import CategoryWiseProducts from "@/components/category/CategoryWiseProducts";


async function fetchProductsByCategory(category: string): Promise<CategoryResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/products/get-products-by-category/?category_slug=${category}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const payload: ProductsByCategoryResponse = await res.json();
    return payload?.result ?? null;
  } catch {
    return null;
  }
}


export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const result = await fetchProductsByCategory(category);

  if (!result?.category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">Category data is unavailable right now.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {
        result.category.display_type === "product_card" ? (
          <>
            <CategoryWiseProducts   
            category_name={result?.category?.name} 
            category_slug={result?.category?.slug} 
            subCategories={result?.data as ProductResponse[]} />
          </>
        ) : 
        <>
        
        </>
      }
    </div>
  );
}
