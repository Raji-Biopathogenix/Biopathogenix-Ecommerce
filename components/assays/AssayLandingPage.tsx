import type { AssayPanelTargetDocument, AssayProduct, AssayTypeConfig } from "@/lib/assays";
import AssayHero from "./AssayHero";
import AssayPanelLinks from "./AssayPanelLinks";
import AssayGrid from "./AssayGrid";
import AssayTargetDownloads from "./AssayTargetDownloads";
import AssayCustomTargetForm from "./AssayCustomTargetForm";
import AssayImageBand from "./AssayImageBand";
import AssayWhyChoose from "./AssayWhyChoose";
import AssayInsights from "./AssayInsights";

interface Props {
  config: AssayTypeConfig;
  products: AssayProduct[];
  panelDocuments: AssayPanelTargetDocument[];
}

export default function AssayLandingPage({ config, products, panelDocuments }: Props) {
  return (
    <main className="bg-white">
      <AssayHero config={config} />
      <AssayPanelLinks current={config} />
      <AssayGrid products={products} label={config.label} />
      <AssayTargetDownloads documents={panelDocuments} />
      <AssayCustomTargetForm config={config} />
      <AssayImageBand config={config} />
      <AssayWhyChoose config={config} />
      <AssayInsights config={config} />
    </main>
  );
}
