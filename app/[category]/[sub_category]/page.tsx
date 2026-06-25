import { API_BASE_URL } from "@/config/env";
import { Products, MultiLevelCatgoryResponse, ProductsByCategoryResponse, SubCategoryResponse,SubCategoryProductCardResponse } from "@/types/product";
import ProductGridPage from "@/components/category/product/ProductPage";
import Pagination from "@/components/pagination/pagination";
import MultiLevelCategoryView from "@/components/category/MultiLevelCategoryView";

async function fetchProductsDataBySubCategory(category: string, subCategory: string,currentPage:number,orderBy:string): Promise<SubCategoryResponse | null> {
  const res = await fetch(`${API_BASE_URL}/v1/products/get-products-by-sub-category/?category_slug=${category}&sub_category_slug=${subCategory}&page=${currentPage}&orderBy=${orderBy}`,
  {
    cache: 'no-store',
  }
  );
  if (!res.ok) return null;

  const response: ProductsByCategoryResponse = await res.json();



  return response?.result ?? {};
}



export default async function SubCategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ category: string; sub_category: string,page?: string }>;
  searchParams: Promise<{ page?: string, orderby ?:string }>;
}) {


  const { category, sub_category } = await params;
  const { page,orderby } = await searchParams;

  const currentPage = Number(page) || 1;
  const orderBy = orderby || '';

  const result = await fetchProductsDataBySubCategory(category, sub_category,currentPage,orderBy);

  return (
    <>
      {result &&
        <main className="min-h-screen bg-white">
          <div className="bg-[#f8fafd] py-10 border-b border-gray-100">
            <div className="max-w-[1400px] mx-auto px-6">
              <div className="flex items-center gap-4">
                {result?.subCategory?.url && <div
                  className="h-12 w-12 rounded-xl bg-white shadow-sm bg-cover bg-center"
                  style={{ backgroundImage: `url(${result?.subCategory?.url})` }}
                />}
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#0b2e59]/60">{result?.category?.name}</p>
                  <h1 className="text-[44px] font-bold text-[#0b2e59]">
                    {result?.subCategory?.name}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[1400px] mx-auto px-6 py-12">
            {
              result?.subCategory?.display_type === "product_card"
                ? <>
                    <ProductGridPage 
                    category={result?.category} 
                    subCategory={result?.subCategory} 
                    products={result?.data as Products[]} 
                    currentPage={(result as SubCategoryProductCardResponse)?.current_page} 
                    totalPages={(result as SubCategoryProductCardResponse)?.total_pages} 
                    count={(result as SubCategoryProductCardResponse)?.count} 
                    />

                    <Pagination 
                    currentPage={(result as SubCategoryProductCardResponse)?.current_page} 
                    totalPages={(result as SubCategoryProductCardResponse)?.total_pages} 
                    count={(result as SubCategoryProductCardResponse)?.count} 
                    orderBy={orderBy}  
                    />

                   </>
                : result?.subCategory?.display_type === "multi_level_cat"
                  ? <MultiLevelCategoryView subLevelCategories={result?.data as MultiLevelCatgoryResponse[]} />
                  : <></>
            }
          </div>
        </main>
      }
    </>
  );
}
