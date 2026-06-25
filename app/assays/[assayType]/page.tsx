import { notFound } from 'next/navigation';
import { ASSAY_TYPE_CONFIG, fetchAssayPageData } from '@/lib/assays';
import AssayLandingPage from '@/components/assays/AssayLandingPage';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ assayType: string }>;
  searchParams?: Promise<{ category_slug?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assayType } = await params;
  const config = ASSAY_TYPE_CONFIG[assayType];
  if (!config) return {};
  return {
    title: `${config.label} | BioPathogenix`,
    description: config.heroSubtitle,
  };
}

export const dynamic = "force-dynamic";

export default async function AssayTypePage({ params, searchParams }: Props) {
  const { assayType } = await params;
  const { category_slug } = searchParams ? await searchParams : {};
  const config = ASSAY_TYPE_CONFIG[assayType];
  if (!config) notFound();

  const { products, panelDocuments } = await fetchAssayPageData(config, category_slug);

  return <AssayLandingPage config={config} products={products} panelDocuments={panelDocuments} />;
}
