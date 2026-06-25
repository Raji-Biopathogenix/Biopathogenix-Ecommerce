import CatalogDownload from "@/components/home/CatalogDownload";
import { getBlogPosts } from "@/lib/learning-center";
import Link from "next/link";

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

export default async function BlogLearningCenterPage() {
  const backendPosts = await getBlogPosts().catch(() => []);

  return (
    <main className="bg-white">
      <div className="bg-[#f8fafd] py-16 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <h1 className="text-[44px] font-bold text-[#0b2e59]">BioPathogenix Learning Center</h1>
          <p className="text-[#0b2e59]/70 text-lg mt-2 max-w-2xl">
            Curated articles and resources to empower researchers and labs with actionable knowledge.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid md:grid-cols-[1fr_1px_1fr] gap-0 items-center">
          {/* Left: large italic quote style */}
          <div className="pr-10 py-6">
            <span className="block text-[72px] leading-none font-serif text-[#ddeaf4] select-none mb-2">&ldquo;</span>
            <p className="text-[#1f3a50] text-lg leading-9 italic">
              Whether you&apos;re exploring best practices for qPCR, learning about custom
              assay development, or seeking expert insights into antimicrobial resistance —
              our BPX™ curated articles and resources are designed to empower researchers
              and labs with actionable knowledge.
            </p>
            <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#2663d4]">
              — BioPathogenix Learning Team
            </span>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-full bg-[#ddeaf4]" />

          {/* Right: checklist */}
          <div className="pl-10 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2663d4] mb-6">
              Topics We Cover
            </p>
            <ul className="space-y-3.5">
              {[
                "Optimizing PCR protocols for accuracy and speed",
                "Innovations in collection and sample prep",
                "Advances in PCR and custom assay design",
                "Strategies to enhance lab workflows",
                "Pioneers of PCR technology",
                "The impact of pivotal pathogens",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="flex-shrink-0 mt-0.5 text-[#2663d4]" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="#e8f0fb" />
                    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#2663d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm text-[#1f3a50] leading-6">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        {backendPosts.length > 0 ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {backendPosts.map((post) => {
              const cardImage = post.featured_image_url || post.images?.[0]?.image_url || "";
              const imageAlt = post.image_alt || post.images?.[0]?.alt_text || post.title;

              return (
                <article key={post.slug} className="text-sm">
                  <Link href={`/resources/blog-learning-center/${post.slug}`} className="block">
                    <div className="mb-4 h-[240px] overflow-hidden rounded-sm bg-[#f0f4f8]">
                      {cardImage ? (
                        <img
                          src={cardImage}
                          alt={imageAlt}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </Link>

                  <h3 className="mb-1 text-base font-semibold leading-snug text-[#2663d4]">
                    <Link href={`/resources/blog-learning-center/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mb-3 text-[11px] text-gray-500">
                    {formatPublishedDate(post.published_at)}
                  </p>
                  <p className="mb-3 leading-6 text-gray-700">{post.excerpt}</p>

                  <Link
                    href={`/resources/blog-learning-center/${post.slug}`}
                    className="text-xs font-semibold text-[#2663d4]"
                  >
                    Read More »
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-[#C5D5E0] bg-[#FAFCFD] p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#5A7689]">
              No blog posts yet
            </p>
            <p className="mt-3 text-sm leading-7 text-[#4B6375]">
              Add your first blog post in the Django admin and it will appear here.
            </p>
          </div>
        )}
      </section>

      <CatalogDownload />
    </main>
  );
}
