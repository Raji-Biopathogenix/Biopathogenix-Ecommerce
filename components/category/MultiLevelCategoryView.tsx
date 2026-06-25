import { getAssayHrefForCategory } from "@/lib/assays";
import { MultiLevelCatgoryResponse, MultiLevelProduct } from "@/types/product";
import Link from "next/link";

const TRADEMARK_SYMBOLS: Record<string, string> = { TM: '™', R: '®', SM: '℠' };

function ProductName({ product }: { product: MultiLevelProduct }) {
  const tm = product.trademark;
  if (!tm?.display) return <>{product.name}</>;
  const symbol = <sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>{TRADEMARK_SYMBOLS[tm.trademark] ?? tm.trademark}</sup>;
  return tm.postion === 'pre'
    ? <>{tm.text}{symbol} {product.name}</>
    : <>{product.name} {tm.text}{symbol}</>;
}

export interface MultiLevelCategoryViewProps {
  subLevelCategories: MultiLevelCatgoryResponse[];
}

export default function MultiLevelCategoryView({ subLevelCategories }: MultiLevelCategoryViewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {subLevelCategories.map((section) => {
        const basePanelHref = getAssayHrefForCategory(section.slug) || getAssayHrefForCategory(section.name);
        const panelHref = basePanelHref ? `${basePanelHref}?category_slug=${section.slug}` : null;

        return (
          <section
            key={section.id}
            className="rounded-md border border-[#d9e5ee] bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold uppercase leading-tight text-[#0b2e59]">
                  {section.name}
                </h2>
                <p className="mt-2 text-sm font-medium text-[#5c7284]">
                  {section.products.length} product{section.products.length === 1 ? "" : "s"}
                </p>
              </div>

              {panelHref ? (
                <Link
                  href={panelHref}
                  className="inline-flex rounded-md bg-[#0b2e59] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#145f8c]"
                >
                  View Panel
                </Link>
              ) : null}
            </div>

            {section.products.length === 0 ? (
              <p className="rounded-md border border-dashed border-[#c9dbe8] bg-[#f7fbfd] px-4 py-5 text-sm text-[#526b7c]">
                No products added yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {section.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product-detail/${product.slug}`}
                    className="rounded-md border border-[#e4edf3] px-4 py-3 text-base font-semibold text-[#236fa6] transition-colors hover:border-[#1582b8] hover:bg-[#f7fbfd]"
                  >
                    <ProductName product={product} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
