import { API_BASE_URL } from "@/config/env";
import { ProductSearchResponse } from "@/types/product";
import ProductGridView from "@/components/category/product/ProductGridView";
import Pagination from "@/components/pagination/pagination";

interface SearchPageProps {
    searchParams: Promise<{ search_text?: string; category?: string ,page?: string}>;
}

interface fetchProductsProps {
    search_text?: string;
    category?: string;
    page?: number;
}

async function fetchProducts({ search_text, category }: fetchProductsProps): Promise<ProductSearchResponse['result'] | null> {
    const params = new URLSearchParams();
    if (search_text) params.set('search_text', search_text);
    if (category) params.set('category', category);

    const res = await fetch(`${API_BASE_URL}/v1/products/search?${params.toString()}`, {
        // next: { revalidate: 60 },
    });
    if (!res.ok) return null;

    const response: ProductSearchResponse = await res.json();
    return response?.result ?? null;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { search_text, category, page } = await searchParams;
    const result = await fetchProducts({ category, search_text,page: Number(page) || 1 });

    console.log("Search Result:", result);


    return (
        <div className="max-w-7xl mx-auto px-4 py-8  "> 
            {result?.data?.serializer && result?.data?.serializer?.length > 0 ?
            <>  
            
            {
            result?.data?.search_result ? <p className="text-2xl my-5 text-center"> Search Results for "{search_text}"</p> : <p className="text-2xl my-5 text-center"> No results found for "{search_text}". Here are some recommended products:</p>
            }


            <p className="text-2xl my-5 text-center"> Search Items</p> 
                <ProductGridView products={result.data?.serializer} />
                
                {result?.current_page && result?.total_pages && result?.count &&  <Pagination 
                    currentPage={result?.current_page} 
                    totalPages={result?.total_pages} 
                    count={result?.count}
                    search_text={search_text}
                    category={category} 
                />}

             </> : <></>}
        </div>
    );
}