import type { AssayProduct } from "@/lib/assays";
import AssayProductCard from "./AssayProductCard";

interface Props {
  products: AssayProduct[];
  label: string;
}

export default function AssayGrid({ products, label }: Props) {
  return (
    <section id="available-assays" className="bg-[#f7fbfd] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase text-[#1582b8]">Available Assays</p>
            <h2 className="text-3xl font-extrabold text-[#0b2e59]">{label}</h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-[#526b7c]">
            Open any assay product to reveal its related details, target coverage, and supporting files in an inline dropdown.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#b8cfdd] bg-white px-6 py-12 text-center">
            <p className="text-[#526b7c]">No assays found yet. Add products and assay details from the admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <AssayProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
