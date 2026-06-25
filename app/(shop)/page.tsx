import { API_BASE_URL } from "@/config/env";
import { LandingPageResponse } from "@/types/header";
import HeroCarousel from "@/components/home2/HeroCarousel";
import AboutSection from "@/components/home2/AboutSection";
import Shopbycategory from '@/components/home2/Shopbycategory';
import PrimaryConversionPathways from '@/components/home2/Primaryconversionpathways';
import SupportingScientificCommunity from '@/components/home2/Supportingscientificcommunity';
import ProductCatalogBanner from "@/components/home2/Productcatalogbanner";
import WhyScientistsChoose from "@/components/home2/Whyscientistschoose";
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
    console.log("res",response)
    return response?.result ?? null;
  } catch {
    return null;
  }
}


  // const ORDERED_COMPONENTS = {

  // } 
//   [
//   '',
//   HeroCarousel,
//   AboutSection,
//   Shopbycategory,
//   PrimaryConversionPathways,
//   WhyScientistsChoose,
//   SupportingScientificCommunity,
//   ProductCatalogBanner,
// ];






export default async function Home() {

  const landingPageContext =await fetchLandingPageContext();
  const pageContents = landingPageContext?.data ?? [];






  return (
    <main className="min-h-screen bg-white">
      {
      pageContents?.length > 0?
      <> 
      {/* {
      pageContents.map((content, index) => {
        const Component = ORDERED_COMPONENTS[content?.order];
        console.log("content=======>",content)
          if (!Component) return null;
          return <Component key={index} result={content} />;
        })
      } */}
          <section className="px-4 pb-8 pt-4 md:px-6 lg:px-8">
            <div className="space-y-4">
              <OffersSection result={pageContents[7]} />
              <HeroCarousel result={pageContents[0]} />
            </div>
          </section>
	        <div className="flex flex-col gap-8 pb-10">
	          <AboutSection result={pageContents[1]} />
	          <Shopbycategory result={pageContents[2]}/>
	          <PrimaryConversionPathways result={pageContents[3]} />
	          <WhyScientistsChoose result={pageContents[4]} />
	          <SupportingScientificCommunity result={pageContents[5]} />
	          <ProductCatalogBanner result={pageContents[6]}/>
          </div>





      </>
	       : <div className="py-20 text-center text-gray-500">Landing page content is not available at the moment. Please check back later.</div>}

    </main>
  );
}
