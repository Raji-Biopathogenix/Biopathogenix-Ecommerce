import { notFound } from "next/navigation";
import { ASSAY_TYPE_CONFIG, fetchAssayPageData } from "@/lib/assays";
import AssayLandingPage from "@/components/assays/AssayLandingPage";
import type { Metadata } from "next";

const QC_SLUGS = [
  "qpcr-quality-control",
  "semi-quant-verification",
  "validation-sets",
  "inclusivity-sets",
];

interface Props {
  params: Promise<{ kitType: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kitType } = await params;
  const config = ASSAY_TYPE_CONFIG[kitType];
  if (!config) return {};
  return {
    title: `${config.label} | BioPathogenix`,
    description: config.heroSubtitle,
  };
}

export const dynamic = "force-dynamic";

export default async function QCKitTypePage({ params }: Props) {
  const { kitType } = await params;
  const config = ASSAY_TYPE_CONFIG[kitType];
  if (!config || !QC_SLUGS.includes(kitType)) notFound();

  const { products, panelDocuments } = await fetchAssayPageData(config);

  return <AssayLandingPage config={config} products={products} panelDocuments={panelDocuments} />;
}
