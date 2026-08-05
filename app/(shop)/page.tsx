import { API_BASE_URL } from "@/config/env";
import { LandingPageResponse } from "@/types/header";
import { LandingPageType } from "@/types/header";
import HeroCarousel from "@/components/home2/HeroCarousel";
import Shopbycategory from '@/components/home2/Shopbycategory';
import HighPerformanceMultiplex from "@/components/home2/HighPerformanceMultiplex";
import PrimaryConversionPathways from '@/components/home2/Primaryconversionpathways';
import SupportingScientificCommunity from '@/components/home2/Supportingscientificcommunity';
import ProductCatalogBanner from "@/components/home2/Productcatalogbanner";

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

  return (
    <main className="min-h-screen bg-white">
      <HeroCarousel result={hero} />
      <Shopbycategory result={shopByCategory} />
      <div className="relative overflow-hidden">
        <img
          src="/images/home/primary-bg.png"
          alt=""
          className="
          pointer-events-none
          absolute
          opacity-25
          select-none

          w-[1800px]
          sm:w-[2200px]
          md:w-[2600px]
          lg:w-[3456px]

          max-w-none

          left-1/2
          -translate-x-1/2

          top-[120px]
          sm:top-[150px]
          md:top-[180px]
          lg:top-[220px]
        "
        />
        <HighPerformanceMultiplex />
        <PrimaryConversionPathways result={conversionPathways} />
      </div>
      <SupportingScientificCommunity result={supportingCommunity} />
      <ProductCatalogBanner result={productCatalog} />
    </main>
  );
}
