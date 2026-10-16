"use client";

import { ProductResponse } from "@/types/product";
import CarouselCategoryView from "./CarouselCategoryView";

export interface CategoryWiseProductsProps {
  category_name: string;
  category_slug: string;
  subCategories: ProductResponse[];
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
  const sortedCategories = [...subCategories]
    .sort((a, b) => alphabetical.compare(a.name, b.name))
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
