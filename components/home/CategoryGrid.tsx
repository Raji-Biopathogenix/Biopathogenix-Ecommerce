import Link from "next/link";
import {
  CATEGORY_FALLBACK,
  fetchCategories,
  sortCategories,
} from "@/lib/categories";

const CATEGORY_PHOTO_MAP: Record<string, string> = {
  "consumable-and-lab-supplies": "/images/home/category-grid/collection-supplies-1.jpg",
  "pcr-kits-panels": "/images/home/category-grid/pcr-reagents-1.jpg",
  "extraction-sample-prep": "/images/home/category-grid/dna-rna-extraction-reagents.jpg",
  "controls-standards": "/images/home/category-grid/pcr-lab-consumables.jpg",
  ppe: "/images/home/category-grid/personal-protection-equipment.jpg",
  "quality-control": "/images/home/category-grid/pcr-lab-consumables.jpg",
  "new-arrivals": "/images/home/category-grid/collection-supplies-1.jpg",
};
const CATEGORY_PHOTO_DEFAULT = "/images/home/category-grid/collection-supplies-1.jpg";

export default async function CategoryGrid() {
  const categories = await fetchCategories();
  console.log("categories",categories)
  const sortedCategories = sortCategories(categories.length ? categories : CATEGORY_FALLBACK);

  return (
    <section className="py-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
          {sortedCategories.map((item) => {
            const href =
              item.slug === "quality-control"
                ? "/quality-control"
                : `/product-category/${item.slug}/`;
            return (
            <Link
              key={item.slug}
              href={href}
              className="group relative h-[420px] rounded-[18px] overflow-hidden"
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${CATEGORY_PHOTO_MAP[item.slug] ?? CATEGORY_PHOTO_DEFAULT})`,
                }}
              />

              {/* Elementor-like gradient overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,42,77,0)_0%,rgba(6,42,77,0.55)_45%,rgba(6,42,77,0.95)_100%)]" />

              {/* Text content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-[24px] font-normal leading-[1.25] text-white mb-3">
                  {item.name+"hereee"}
                </h2>

                <span className="inline-flex items-center gap-2 text-[14px] font-medium text-white underline underline-offset-4">
                  Shop Now <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}


