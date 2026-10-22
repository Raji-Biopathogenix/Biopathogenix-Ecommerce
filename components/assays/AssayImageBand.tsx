import type { AssayTypeConfig } from "@/lib/assays";

interface Props {
  config: AssayTypeConfig;
}

export default function AssayImageBand({ config }: Props) {
  return (
    <section
      className="min-h-[270px] bg-[#1f3f4f] px-6 py-16 text-white"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(21, 45, 56, 0.9), rgba(21, 45, 56, 0.75)), url("${config.bandImage}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 text-sm font-semibold uppercase text-[#a4e1d8]">Targets and documents</p>
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-white">
          Explore assay panels, pathogen coverage, and supporting resources for your laboratory.
        </h2>
      </div>
    </section>
  );
}
