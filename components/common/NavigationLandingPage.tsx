import Link from "next/link";
import { NavigationGroup } from "@/lib/navigation";

type NavigationLandingPageProps = {
  group: NavigationGroup;
  eyebrow?: string;
  description?: string;
};

export default function NavigationLandingPage({
  group,
  eyebrow = "Explore",
  description,
}: NavigationLandingPageProps) {
  const items = [...group.items].sort((a, b) => a.order - b.order);

  return (
    <section className="bg-[#f8fbff]">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6f87ad]">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold text-[#123669] md:text-6xl [font-family:'Times_New_Roman',Times,serif]">
            {group.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-[#36527d] md:text-lg">
            {description ??
              `Browse the latest ${group.title.toLowerCase()} sections and jump directly into the area that fits your workflow.`}
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              target={item.open_in_new_tab ? "_blank" : undefined}
              rel={item.open_in_new_tab ? "noreferrer" : undefined}
              className="group rounded-3xl border border-[#d7e3f1] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[#9ab5d8] hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-[#123669] [font-family:'Times_New_Roman',Times,serif]">
                  {item.title}
                </h2>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e9f1fb] text-[#123669] transition group-hover:bg-[#123669] group-hover:text-white">
                  →
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#4f6589]">
                Open the {item.title.toLowerCase()} section and explore the content available there.
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
