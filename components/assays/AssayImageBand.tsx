import type { AssayTypeConfig } from "@/lib/assays";

interface Props {
  config: AssayTypeConfig;
}

export default function AssayImageBand({ config }: Props) {
  return (
    <section
      className="min-h-[270px] bg-[#1f3f4f] px-6 py-16 text-white"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(21, 45, 56, 0.82), rgba(21, 45, 56, 0.34)), url("${config.bandImage}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 text-sm font-semibold uppercase text-[#a4e1d8]">Targets and documents</p>
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight">
          Keep every assay panel connected to the product, pathogen list, and downloadable files.
        </h2>
      </div>
    </section>
  );
}
