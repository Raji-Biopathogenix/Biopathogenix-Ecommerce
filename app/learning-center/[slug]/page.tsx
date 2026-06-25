import { redirect } from "next/navigation";

export default async function LearningCenterPostAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/resources/blog-learning-center/${slug}`);
}
