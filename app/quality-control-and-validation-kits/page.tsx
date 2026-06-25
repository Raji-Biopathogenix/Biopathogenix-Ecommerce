import Link from "next/link";
import { QC_KIT_CONFIGS, fetchAssayPageData, getProductDetailHref } from "@/lib/assays";
import type { AssayProduct, AssayTypeConfig } from "@/lib/assays";

async function fetchColumnProducts(config: AssayTypeConfig): Promise<AssayProduct[]> {
  try {
    const { products } = await fetchAssayPageData(config);
    return products;
  } catch {
    return [];
  }
}

const BADGE: Record<string, { label: string; style: string }> = {
  qpcr_qc: { label: "NEW!", style: "font-semibold" },
};

export default async function QualityControlValidationKits() {
  const columns = await Promise.all(
    QC_KIT_CONFIGS.map(async (config) => ({
      config,
      products: await fetchColumnProducts(config),
    }))
  );

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4">

        <h1 className="text-4xl md:text-5xl font-bold text-[#0B3C5D] mb-10">
          Quality Control and Validation Kits
        </h1>

        <div className="h-px w-full bg-blue-200 mb-14" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-[#0B3C5D]">
          {columns.map(({ config, products }) => {
            const badge = BADGE[config.apiAssayType];
            const titleWords = config.label.split(" ");
            const lastWord = titleWords.pop();

            return (
              <div key={config.routeSlug} className="space-y-4">
                <Link
                  href={`/quality-control-and-validation-kits/${config.routeSlug}`}
                  className="block hover:opacity-80 transition-opacity"
                >
                  <h3 className="text-2xl font-medium leading-tight">
                    {titleWords.join(" ")}{" "}
                    {lastWord}{" "}
                    {badge && (
                      <span className={badge.style}>{badge.label}</span>
                    )}
                  </h3>
                </Link>

                <div className="space-y-2">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <Link
                        key={product.id}
                        href={getProductDetailHref(product)}
                        className="block text-blue-600 underline underline-offset-4 hover:text-blue-800 text-sm leading-snug"
                      >
                        {product.name}
                      </Link>
                    ))
                  ) : (
                    config.apiAssayType !== "qpcr_qc" && (
                      <p className="text-sm text-gray-400 italic">Products coming soon</p>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-px w-full bg-blue-200 mt-16" />
      </div>
    </section>
  );
}
