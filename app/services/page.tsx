import NavigationLandingPage from "@/components/common/NavigationLandingPage";
import { fetchNavigationMenu, NAVIGATION_FALLBACK } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function ServicesLandingPage() {
  const navigation = await fetchNavigationMenu();
  const servicesGroup =
    navigation.find((group) => group.slug === "services") ??
    NAVIGATION_FALLBACK.find((group) => group.slug === "services");

  if (!servicesGroup) {
    return null;
  }

  return (
    <NavigationLandingPage
      group={servicesGroup}
      eyebrow="Services"
      description="Choose a service area to learn more about validation, assay support, and custom development offerings."
    />
  );
}
