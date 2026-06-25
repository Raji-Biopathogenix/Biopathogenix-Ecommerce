import type { AssayTypeConfig } from "@/lib/assays";
import Link from "next/link";

interface Props {
  config: AssayTypeConfig;
}

export default function AssayHero({ config }: Props) {
  return (
    <section
      className="relative overflow-hidden bg-[#0b2e59] text-white"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(7, 31, 58, 0.88), rgba(7, 31, 58, 0.62), rgba(7, 31, 58, 0.18)), url("${config.heroImage}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="mx-auto flex min-h-[430px] max-w-7xl items-center px-6 py-14">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase text-[#9bd2eb]">
            {config.eyebrow}
          </p>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white lg:text-5xl">
            {config.heroTitle}
          </h1>
          <p className="mb-7 max-w-2xl text-lg leading-relaxed text-[#d9edf7]">
            {config.heroSubtitle}
          </p>
          <div className="mb-8 flex flex-wrap gap-3">
            {config.highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-md border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white"
              >
                {highlight}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="#available-assays"
              className="rounded-md bg-white px-6 py-3 text-sm font-bold text-[#0b2e59] transition-colors hover:bg-[#e8f6fb]"
            >
              Browse Assays
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-white px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
