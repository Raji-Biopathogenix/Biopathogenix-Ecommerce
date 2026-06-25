import Link from "next/link";
import { ASSAY_PANEL_LINKS, type AssayTypeConfig } from "@/lib/assays";

interface Props {
  current: AssayTypeConfig;
}

export default function AssayPanelLinks({ current }: Props) {
  return (
    <section className="border-b border-[#d9e5ee] bg-white px-6 py-5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        {ASSAY_PANEL_LINKS.map((panel) => {
          const isActive = panel.routeSlug === current.routeSlug;
          return (
            <Link
              key={panel.routeSlug}
              href={`/assays/${panel.routeSlug}`}
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-[#0b2e59] bg-[#0b2e59] text-white"
                  : "border-[#c9dbe8] bg-white text-[#24587c] hover:border-[#1582b8] hover:text-[#1582b8]"
              }`}
            >
              {panel.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
