import CatalogDownload from "@/components/home/CatalogDownload";
import { getBlogPost } from "@/lib/learning-center";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { BlogPost } from "@/lib/learning-center";

export const dynamic = "force-dynamic";

function formatPublishedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const post = await getBlogPost(slug);
    return {
      title: `${post.title} | BioPathogenix Learning Center`,
      description: post.excerpt || post.title,
    };
  } catch {
    return {
      title: "Learning Center | BioPathogenix",
    };
  }
}

export default async function BlogLearningCenterPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post: BlogPost | null = null;
  try {
    post = await getBlogPost(slug);
  } catch {
    notFound();
  }

  const heroImage =
    post.featured_image_url ||
    "/images/assay%20landing%20page/Lyophilization-BioPath-Website-Blog.png";
  const galleryImages = (post.images ?? []).filter((img) => img.show_in_gallery);

  return (
    <main className="bg-white">
      {/* Split header: title left, image right */}
      <section className="bg-[#f0f5f9] py-12 border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm font-semibold text-[#2663d4] mb-4 uppercase tracking-widest">
                {formatPublishedDate(post.published_at)}
              </p>
              <h1 className="text-3xl md:text-[40px] font-bold text-[#0b2e59] leading-tight">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="mt-4 text-[#5a7689] leading-relaxed text-base">{post.excerpt}</p>
              ) : null}
              <Link
                href="/resources/blog-learning-center"
                className="mt-6 inline-flex items-center gap-2 text-sm text-[#2663d4] font-medium hover:underline"
              >
                ← Back to Learning Center
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl shadow-md">
              <img
                src={heroImage}
                alt={post.image_alt || post.title}
                className="w-full h-[320px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Article body */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <div
          className="text-[15px] leading-8 text-[#223848]
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#0b2e59] [&_h2]:mt-10 [&_h2]:mb-4
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#0b2e59] [&_h3]:mt-8 [&_h3]:mb-3
            [&_p]:mb-4 [&_p]:leading-8
            [&_a]:font-semibold [&_a]:text-[#2663d4] [&_a]:underline
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
            [&_li]:leading-7
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#2663d4] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#5a7689] [&_blockquote]:my-6
            [&_img]:my-6 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-xl [&_img]:shadow-sm
            [&_figure]:my-6 [&_figure>img]:w-full [&_figure>img]:rounded-xl
            [&_strong]:font-semibold [&_strong]:text-[#0b2e59]"
          dangerouslySetInnerHTML={{
            __html: post.content_html || "<p>This article has no body content yet.</p>",
          }}
        />

        {galleryImages.length > 0 ? (
          <div className="grid gap-4 mt-10 sm:grid-cols-2">
            {galleryImages.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl">
                <img
                  src={item.image_url}
                  alt={item.alt_text || post.title}
                  className="w-full h-[240px] object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}
      </section>


      <CatalogDownload />
    </main>
  );
}
