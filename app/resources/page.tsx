import NavigationLandingPage from "@/components/common/NavigationLandingPage";
import { fetchNavigationMenu, NAVIGATION_FALLBACK } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function ResourcesLandingPage() {
  const navigation = await fetchNavigationMenu();
  const resourcesGroup =
    navigation.find((group) => group.slug === "resources") ??
    NAVIGATION_FALLBACK.find((group) => group.slug === "resources");

  if (!resourcesGroup) {
    return null;
  }

  return (
    <NavigationLandingPage
      group={resourcesGroup}
      eyebrow="Resources"
      description="Start here to browse learning materials, product sheets, protocols, FAQs, and training content."
    />
  );
}
