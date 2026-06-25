"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { type AssayProduct } from "@/lib/assays";

interface Props {
  product: AssayProduct;
  productHref: string;
}

function htmlToPlainText(value: string) {
  if (!value) return "";

  const withBreaks = value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|section|article|li|tr|h[1-6]|ul|ol)\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\s*[^>]+>/g, "");

  const decoded = withBreaks
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return decoded
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isHeadingLine(line: string) {
  return /:\s*$/.test(line) || /^(Taxonomy|Transmission|Research Challenges|Overview|Notes|Summary)$/i.test(line);
}

export default function AssayProductInfoDisclosure({ product, productHref }: Props) {
  const sections = useMemo(
    () =>
      [...(product.related_information ?? [])]
        .filter((section) => section.title.trim() || section.content.trim())
        .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [product.related_information]
  );
  const [openIds, setOpenIds] = useState<number[]>([]);

  const toggleSection = (id: number) => {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((sectionId) => sectionId !== id) : [...current, id]
    );
  };

  if (!sections.length) {
    return null;
  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#d7e6ef] bg-[#f8fbfe]">
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5c7284]">
            Related information
          </p>
          <p className="mt-1 text-sm font-semibold text-[#0b2e59]">
            {openIds.length ? "Hide panel details" : "Open panel details"}
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#236fa6] shadow-sm">
          {sections.length} section{sections.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="border-t border-[#d7e6ef] bg-white px-4 py-4">
        <div className="space-y-2">
          {sections.map((section) => {
            const isOpen = openIds.includes(section.id);
            return (
              <div key={section.id} className="overflow-hidden rounded-2xl border border-[#e3edf5] bg-[#fbfdff]">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f1f8fd]"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#4f6275]">
                      {section.title}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#0b2e59]">
                      {isOpen ? "Hide details" : "Open details"}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dotted border-[#6b7a89] text-[#0b2e59]">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                {isOpen ? (
                  <div className="border-t border-[#e3edf5] px-4 py-3 text-sm leading-relaxed text-[#243544]">
                    <div className="space-y-1.5 whitespace-pre-line">
                      {htmlToPlainText(section.content)
                        .split("\n")
                        .map((line, index) => {
                          const trimmed = line.trim();
                          if (!trimmed) return null;

                          return (
                            <p
                              key={`${section.id}-${index}`}
                              className={isHeadingLine(trimmed) ? "font-extrabold text-[#0b2e59]" : ""}
                            >
                              {trimmed}
                            </p>
                          );
                        })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 px-4 pb-4">
        <Link
          href={productHref}
          className="rounded-md border border-[#3997d1] px-4 py-2.5 text-center text-sm font-bold text-[#236fa6] transition-colors hover:bg-[#eef8fc]"
        >
          Panel details
        </Link>
      </div>
    </div>
  );
}
