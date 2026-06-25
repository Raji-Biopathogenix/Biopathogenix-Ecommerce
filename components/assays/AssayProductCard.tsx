"use client";

import Image from "next/image";
import Link from "next/link";
import {
  getProductDetailHref,
  getProductImageSrc,
  type AssayProduct,
  type ProductTrademark,
} from "@/lib/assays";
import AssayProductInfoDisclosure from "./AssayProductInfoDisclosure";

const TM_SYMBOLS: Record<string, string> = { TM: '™', R: '®', SM: '℠' };

function ProductName({ name, trademark }: { name: string; trademark?: ProductTrademark }) {
  if (!trademark?.display) return <>{name}</>;
  const symbol = <sup style={{ fontSize: '0.6em' }}>{TM_SYMBOLS[trademark.trademark] ?? trademark.trademark}</sup>;
  return trademark.postion === 'pre'
    ? <>{trademark.text}{symbol} {name}</>
    : <>{name} {trademark.text}{symbol}</>;
}

interface Props {
  product: AssayProduct;
}

export default function AssayProductCard({ product }: Props) {
  const detail = product.assay_detail;
  const productHref = getProductDetailHref(product);
  const imageSrc = getProductImageSrc(product);
  const targetCount = detail?.target_count ?? 0;
  const catalogNumber = detail?.catalog_number?.trim() || "";

  return (
    <article className="overflow-hidden rounded-2xl border border-[#d9e5ee] bg-white p-5 shadow-md transition-shadow hover:shadow-lg">
      <div className="flex min-h-[420px] flex-col">
        <div className="flex-1">
          <div className="mb-6 grid grid-cols-[140px_1fr] gap-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#4b4f52]">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  fill
                  alt={product.primary_image?.alt_text || product.name}
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm font-bold text-white">
                  Assay Img Placeholder
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <Link href={productHref}>
                <h3 className="text-2xl font-extrabold leading-tight text-[#1a1f26] transition-colors hover:text-[#1582b8]">
                  {detail?.panel_name
                    ? <ProductName name={detail.panel_name} trademark={product.trademark} />
                    : <ProductName name={product.name} trademark={product.trademark} />}
                </h3>
              </Link>
              <div className="mt-3 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5c7284]">
                  Catalog number
                </p>
                <p className="text-sm font-semibold text-[#243544]">
                  {catalogNumber || "Not set"}
                </p>
                <p className="text-xs font-semibold text-[#7a8a98]">
                  SKU: {product.sku}
                </p>
              </div>
            </div>
          </div>

          {product.short_description && (
            <p className="mb-6 line-clamp-4 text-base leading-relaxed text-[#2d3138]">
              {product.short_description}
            </p>
          )}

          <div className="space-y-4 text-base">
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <p className="font-extrabold text-[#1a1f26]">Reaction Format</p>
              <p className="text-right font-medium text-[#2d3138]">{detail?.reaction_format || "Product format"}</p>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <p className="font-extrabold text-[#1a1f26]">Targets</p>
              <p className="text-right font-medium text-[#2d3138]">{targetCount || 0} Targets</p>
            </div>
          </div>

          <AssayProductInfoDisclosure
            product={product}
            productHref={productHref}
          />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link
            href={productHref}
            className="rounded-md bg-[#3997d1] px-4 py-3 text-center text-sm font-extrabold text-white transition-colors hover:bg-[#197bb6]"
          >
            Panel Details
          </Link>
          <Link
            href={productHref}
            className="rounded-md bg-[#3997d1] px-4 py-3 text-center text-sm font-extrabold text-white transition-colors hover:bg-[#197bb6]"
          >
            Order
          </Link>
        </div>
      </div>
    </article>
  );
}
