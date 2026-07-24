import { API_BASE_URL } from "@/config/env";
import { LandingPageResponse } from "@/types/header";
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

// Landing page sections, in the order they must be created in Django admin
// (LandingPageType.order 0-5): Hero, Shop by Category, Primary Conversion
// Pathways, Supporting Scientific Community, Product Catalog, Offers.
// High Performance Multiplex is fully static and isn't admin-managed.
export default async function Home() {
  const landingPageContext = await fetchLandingPageContext();
  const pageContents = landingPageContext?.data ?? [];

  return (
    <main className="min-h-screen bg-white">
      {pageContents?.length > 0 ? (
        <>
          <section className="px-4 pb-8 pt-4 md:px-6 lg:px-8">
            <div className="space-y-4">
              <OffersSection result={pageContents[5]} />
              <HeroCarousel result={pageContents[0]} />
            </div>
          </section>
          <div className="flex flex-col gap-8 pb-10">
            <Shopbycategory result={pageContents[1]} />
            <HighPerformanceMultiplex />
            <PrimaryConversionPathways result={pageContents[2]} />
            <SupportingScientificCommunity result={pageContents[3]} />
            <ProductCatalogBanner result={pageContents[4]} />
          </div>
        </>
      ) : (
        <div className="py-20 text-center text-gray-500">Landing page content is not available at the moment. Please check back later.</div>
      )}
    </main>
  );
}
