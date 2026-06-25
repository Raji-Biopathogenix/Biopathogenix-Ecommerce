import type { Pathogen, PathogenType } from "@/lib/assays";

const TYPE_COLORS: Record<PathogenType, string> = {
  viral: "bg-[#fff1f0] text-[#a13b32] border-[#f0c7c2]",
  bacterial: "bg-[#eef8fc] text-[#145f8c] border-[#b9d9ec]",
  fungal: "bg-[#fff8e5] text-[#78540c] border-[#ecd28d]",
  parasitic: "bg-[#effaf2] text-[#2f6840] border-[#bfe2c8]",
  protozoal: "bg-[#f4f1ff] text-[#574597] border-[#d7cff7]",
  other: "bg-[#f3f6f8] text-[#5c7284] border-[#d1dde5]",
};

const TYPE_ORDER: PathogenType[] = ["viral", "bacterial", "fungal", "parasitic", "protozoal", "other"];

interface Props {
  pathogens: Pathogen[];
}

export default function PathogenList({ pathogens }: Props) {
  const grouped = TYPE_ORDER.reduce<Record<string, Pathogen[]>>((acc, type) => {
    const group = pathogens.filter((pathogen) => pathogen.pathogen_type === type);
    if (group.length) acc[type] = group;
    return acc;
  }, {});

  return (
    <div className="bg-[#f7fbfd] px-5 pb-5">
      {Object.entries(grouped).map(([type, list]) => (
        <div key={type} className="mb-4 last:mb-0">
          <h4 className="mb-2 pt-4 text-xs font-bold uppercase text-[#5c7284]">
            {list[0].pathogen_type_label} ({list.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {list.map((pathogen) => (
              <span
                key={pathogen.id}
                title={pathogen.scientific_name || undefined}
                className={`inline-flex rounded-md border px-3 py-1.5 text-xs font-medium leading-tight ${TYPE_COLORS[pathogen.pathogen_type]}`}
              >
                {pathogen.name}
                {pathogen.scientific_name ? (
                  <span className="ml-1 italic opacity-75">({pathogen.scientific_name})</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
