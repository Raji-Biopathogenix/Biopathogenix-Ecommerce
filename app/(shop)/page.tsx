import { API_BASE_URL } from "@/config/env";
import { LandingPageResponse } from "@/types/header";
import { LandingPageType } from "@/types/header";
import HeroCarousel from "@/components/home2/HeroCarousel";
import Shopbycategory from '@/components/home2/Shopbycategory';
import HighPerformanceMultiplex from "@/components/home2/HighPerformanceMultiplex";
import PrimaryConversionPathways from '@/components/home2/Primaryconversionpathways';
import SupportingScientificCommunity from '@/components/home2/Supportingscientificcommunity';
import ProductCatalogBanner from "@/components/home2/Productcatalogbanner";
import OffersSection from "@/components/home2/OffersSection";

export type LandingPageResult = LandingPageResponse["result"];
export const dynamic = "force-dynamic";

async function fetchLandingPageContext(): Promise<LandingPageResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/landing-page/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const response: LandingPageResponse = await res.json();
    return response?.result ?? null;
  } catch {
    return null;
  }
}

// Sections are matched by name keyword, not by array position - this way a
// section that's missing, renamed, or reordered in Django admin can never be
// silently swapped with a different one. Give each LandingPageType a `name`
// containing one of these keywords (case-insensitive).
function findSection(data: LandingPageType[], keywords: string[]): LandingPageType | undefined {
  return data.find((item) => keywords.some((keyword) => item?.name?.toLowerCase().includes(keyword)));
}

export default async function Home() {
  const landingPageContext = await fetchLandingPageContext();
  const pageContents = landingPageContext?.data ?? [];

  const hero = findSection(pageContents, ["hero"]);
  const shopByCategory = findSection(pageContents, ["categor"]);
  const conversionPathways = findSection(pageContents, ["conversion", "pathway"]);
  const supportingCommunity = findSection(pageContents, ["scientific", "communit"]);
  const productCatalog = findSection(pageContents, ["catalog"]);
  const offers = findSection(pageContents, ["offer"]);

  return (
    <main className="min-h-screen bg-white">
      {pageContents?.length > 0 ? (
        <>
          <section className="px-4 pb-8 pt-4 md:px-6 lg:px-8">
            <div className="space-y-4">
              <OffersSection result={offers} />
              <HeroCarousel result={hero} />
            </div>
          </section>
          <div className="flex flex-col gap-8 pb-10">
            <Shopbycategory result={shopByCategory} />
            <HighPerformanceMultiplex />
            <PrimaryConversionPathways result={conversionPathways} />
            <SupportingScientificCommunity result={supportingCommunity} />
            <ProductCatalogBanner result={productCatalog} />
          </div>
        </>
      ) : (
        <div className="py-20 text-center text-gray-500">Landing page content is not available at the moment. Please check back later.</div>
      )}
    </main>
  );
}
