import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { fetchProducts } from "@/lib/products";
import { getEffectiveProductPrice } from "@/lib/productPricing";

interface Product {
  id: number;
  title: string;
  category: string;
  price: string;
  image: string;
  link: string;
}

const fallbackProducts: Product[] = [
  {
    id: 1,
    title: "Fecal Swab with Cary Blair Medium (2 mL)",
    category: "Specimen Collection Supplies",
    price: "$1,200.00",
    image: "/images/products/fecal-swab-with-cary-blair-medium-2-mL.jpg",
    link: "/product/fecal-swab",
  },
  {
    id: 2,
    title: "BPX™ qPLEX Urinary Tract Profile Version 2",
    category: "qPLEX PCR Reagents",
    price: "Login to view price",
    image: "/images/products/UTI-Quadruplex-V2-scaled.jpg",
    link: "/product/bpx-qplex",
  },
  {
    id: 3,
    title: "Amies Transport Media Tube w/ STD & Mini Swab Kit",
    category: "Specimen Collection Supplies",
    price: "$60.00 - $1,000.00",
    image: "/images/products/amies_transport_media_std_mini_swab_kit.jpg",
    link: "/product/amies-kit",
  },
  {
    id: 4,
    title: "Culture & Sensitivity Tubes",
    category: "Specimen Collection Supplies",
    price: "$25.00 - $230.00",
    image: "/images/products/culture_sensitivity_tubes.jpg",
    link: "/product/culture-tubes",
  },
  {
    id: 5,
    title: "No Additive Tubes",
    category: "Specimen Collection Supplies",
    price: "$25.00 - $275.00",
    image: "/images/products/4-mL-Tube-No-Additive-Pack-of-400.png",
    link: "/product/no-additive",
  },
];

const FALLBACK_IMAGE = "/images/products/fecal-swab-with-cary-blair-medium-2-mL.jpg";

export default async function FeaturedProductsScroll() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const { items } = await fetchProducts({ featured: true, pageSize: 10, accessToken: token });
  const mappedProducts: Product[] = items.map((item) => {
    const price = getEffectiveProductPrice(item);
    const comparePrice = item.compare_price ? Number(item.compare_price) : null;
    const displayPrice = comparePrice && comparePrice > price
      ? `$${price.toFixed(2)}`
      : price > 0
        ? `$${price.toFixed(2)}`
        : "Login to view price";

    return {
      id: item.id,
      title: item.name,
      category: item.category_name || "",
      price: displayPrice,
      image: item.primary_image?.image_url || FALLBACK_IMAGE,
      link: "/shop",
    };
  });

  const products = mappedProducts.length ? mappedProducts : fallbackProducts;

  return (
    <section className="bg-[#f3f8fb] py-12">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold text-[#003b5c]">
            Featured Products
          </h2>

          <Link
            href="/product-category/new-arrivals/"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Shop Now →
          </Link>
        </div>

        {/* Scroll Container */}
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
          {products.map((product) => (
            <Link
              href={product.link}
              key={product.id}
              className="min-w-[280px] max-w-[280px] bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
            >
              {/* Image */}
              <div className="relative h-[220px] mb-4">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Category */}
              <p className="text-xs uppercase text-gray-400 mb-1">
                {product.category}
              </p>

              {/* Title */}
              <h3 className="font-semibold text-sm text-gray-800 leading-snug mb-3 min-h-[48px]">
                {product.title}
              </h3>

              {/* Price */}
              <p className="text-blue-600 font-medium text-sm">
                {product.price}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
