"use client";

import { ProductResponse } from "@/types/product";
import CarouselCategoryView from "./CarouselCategoryView";

export interface CategoryWiseProductsProps {
  category_name: string;
  category_slug: string;
  subCategories: ProductResponse[];
}

// Product overview order; products within each section still sort A–Z.
const PRODUCT_SECTIONS = [
  /consumables?|lab supplies/,
  /extraction|sample prep/,
  /assay|pcr.*(?:kits|panels)/,
  /\bppe\b|personal protect/,
  /new arrivals/,
];

function productSectionRank(category: ProductResponse) {
  const label = `${category.slug} ${category.name}`.toLowerCase().replace(/[-_]/g, " ");
  const rank = PRODUCT_SECTIONS.findIndex((pattern) => pattern.test(label));
  return rank < 0 ? PRODUCT_SECTIONS.length : rank;
}

export default function CategoryWiseProducts({
  category_name,
  category_slug,
  subCategories,
}: CategoryWiseProductsProps) {
  const alphabetical = new Intl.Collator("en", {
    sensitivity: "base",
    numeric: true,
  });
  const sortedCategories = [...(subCategories ?? [])]
    .sort((a, b) => {
      if (category_slug === "product") {
        const sectionOrder = productSectionRank(a) - productSectionRank(b);
        if (sectionOrder !== 0) return sectionOrder;
      }
      return alphabetical.compare(a.name, b.name);
    })
    .map((category) => ({
      ...category,
      products: [...(category.products ?? [])].sort((a, b) =>
        alphabetical.compare(a.name, b.name),
      ),
    }));

  return (
    <>
      <h1 className="text-4xl font-bold text-[#0b2e59] mb-8">
        {category_name}
      </h1>
      <CarouselCategoryView
        subCategories={sortedCategories}
        category_slug={category_slug}
      />
    </>
  );
}
