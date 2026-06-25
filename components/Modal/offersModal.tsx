import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { LandingPageType } from "@/types/header";

interface OffersCarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: LandingPageType;
}

function getPlainText(content?: string) {
  if (!content) return "";
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getOfferValue(offer: LandingPageType["contexts"][number], index: number) {
  const source = getPlainText(offer.title || offer.description);
  const match = source.match(/\d+\s*%/);
  return match?.[0] ?? `Offer ${index + 1}`;
}

function renderOfferText(content?: string) {
  if (!content) return null;

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(content),
      }}
    />
  );
}

export default function OffersCarouselModal({
  isOpen,
  onClose,
  result,
}: OffersCarouselModalProps) {
  const touchStartX = useRef<number | null>(null);
  const offers = useMemo(() => result?.contexts ?? [], [result]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 2;

  const totalPages = Math.max(1, Math.ceil(offers.length / itemsPerPage));
  const pagedOffers = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return offers.slice(start, start + itemsPerPage);
  }, [currentPage, offers]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 40) {
      setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
    } else if (delta < -40) {
      setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
    }
    touchStartX.current = null;
  };

  if (!isOpen || !offers.length) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#081224]/68 px-4 py-6 backdrop-blur-[5px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[820px] overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_30px_120px_rgba(3,15,31,0.35)]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid lg:grid-cols-[320px_1fr]">
          <div className="bg-[linear-gradient(180deg,#152042_0%,#1a2550_100%)] px-6 py-7 text-white md:px-7">
            <div className="space-y-5">
              <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7fe1ff]">
                Promotional Hub
              </span>
              <div className="space-y-3">
                <h3 className="max-w-[10ch] text-[2rem] font-semibold leading-[1.1]">
                  Current savings for your lab
                </h3>
                <p className="text-sm leading-7 text-[#d6def4]">
                  Review active promotions across assays, controls, and specimen collection supplies in one clear, business-friendly view.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/8 p-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7fe1ff]">
                  Active Promotions
                </span>
                <div className="mt-3 text-4xl font-semibold leading-none">{offers.length}</div>
                <p className="mt-3 text-sm leading-6 text-[#d6def4]">
                  Timely discounts and featured campaigns are grouped here so visitors can review them without interrupting the main homepage journey.
                </p>
              </div>
            </div>
          </div>

          <div className="relative px-6 py-6 md:px-7 md:py-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close offers modal"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e3eb] bg-white text-lg text-[#7b8ea0] transition-colors hover:text-[#0d1f3c]"
          >
            x
          </button>

          <div className="pr-10">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b90a4]">
                All Offers
              </span>
              <h3 className="text-[1.9rem] font-semibold leading-tight text-[#142242]">
                Featured promotions on key product lines
              </h3>
              <p className="max-w-[54ch] text-sm leading-7 text-[#60788d]">
                Explore current offers for molecular diagnostics workflows, laboratory consumables, and supporting resources tailored to research and clinical teams.
              </p>
            </div>
          </div>

          <div className="relative mt-6 flex items-center justify-center gap-3">
            {totalPages > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1))}
                aria-label="Previous promotions"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9e3eb] bg-white text-sm font-semibold text-[#6c8195] transition-colors hover:border-[#c2d3e0] hover:text-[#0d1f3c]"
              >
                {"<"}
              </button>
            ) : (
              <div className="h-8 w-8 shrink-0" />
            )}

            <div className="grid min-h-[132px] flex-1 grid-cols-1 gap-4 md:max-w-[460px] md:grid-cols-2">
              {pagedOffers.map((offer, index) => (
                <Link
                  key={offer.id ?? `${currentPage}-${index}`}
                  href={offer?.btn_url || "#"}
                  onClick={onClose}
                  className="group flex min-h-[220px] flex-col rounded-[22px] border border-[#d7e1ea] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 text-left shadow-[0_10px_28px_rgba(13,31,60,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#bdd1df] hover:shadow-[0_16px_34px_rgba(13,31,60,0.12)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full bg-[#eef9fd] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#247b98]">
                      Offer {currentPage * itemsPerPage + index + 1}
                    </span>
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4caed0]" />
                  </div>

                  <div className="mt-5 flex-1 space-y-3">
                    <div className="text-[1.8rem] font-semibold leading-none text-[#142242]">
                      {getOfferValue(offer, currentPage * itemsPerPage + index)}
                    </div>
                    <div className="text-base font-semibold leading-6 text-[#0d1f3c]">
                      {renderOfferText(offer?.title || offer?.description)}
                    </div>
                    {offer?.short_description ? (
                      <div className="line-clamp-3 text-sm leading-6 text-[#60788d]">
                        {renderOfferText(offer.short_description)}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#e7eef5] pt-4 text-sm font-semibold text-[#142242]">
                    <span>Open offer</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">{">"}</span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1))}
                aria-label="Next promotions"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9e3eb] bg-white text-sm font-semibold text-[#6c8195] transition-colors hover:border-[#c2d3e0] hover:text-[#0d1f3c]"
              >
                {">"}
              </button>
            ) : (
              <div className="h-8 w-8 shrink-0" />
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentPage(index)}
                aria-label={`Go to promotion page ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentPage ? "w-5 bg-[#20345d]" : "w-2.5 bg-[#c8d5e0]"
                }`}
              />
            ))}
          </div>

          <div className="mt-2 text-center text-xs font-medium text-[#8aa0b2]">
            {currentPage + 1} / {totalPages}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
