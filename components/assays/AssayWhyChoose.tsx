import type { AssayTypeConfig } from "@/lib/assays";

interface Props {
  config: AssayTypeConfig;
}

export default function AssayWhyChoose({ config }: Props) {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase text-[#1582b8]">Why choose BPX qPLEX</p>
          <h2 className="text-3xl font-extrabold text-[#0b2e59]">{config.whyTitle}</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {config.features.map((feature, index) => (
            <article
              key={feature.title}
              className="rounded-md border border-[#d9e5ee] bg-[#f7fbfd] p-6"
            >
              <span className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#1582b8] text-sm font-extrabold text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mb-3 text-lg font-extrabold text-[#0b2e59]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[#526b7c]">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
