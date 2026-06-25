import { API_BASE_URL } from "@/config/env";
import { ProductDetailResponse } from "@/types/product";
import ProductDetailPage from "@/components/ProductDetail/ProductDetailPage";

export const dynamic = "force-dynamic";

export const revalidate = 0;

async function fetchProductDetail(slug: string): Promise<ProductDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/v1/product_detail?slug=${slug}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error("Failed to fetch product details");
  return res.json();
}

export default async function NestedProductDetailPage({
  params,
}: {
  params: Promise<{ category: string; sub_category: string; product: string }>;
}) {
  const { product } = await params;
  const response = await fetchProductDetail(product);
  const productData = response?.result?.data;

  return <ProductDetailPage prd_details={productData} />;
}
