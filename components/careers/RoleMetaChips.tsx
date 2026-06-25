type RoleMetaChipsProps = {
  location?: string;
  employmentType?: string;
  salaryRange?: string;
  className?: string;
};

export default function RoleMetaChips({
  location,
  employmentType,
  salaryRange,
  className = "",
}: RoleMetaChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {location ? (
        <span className="rounded-full bg-[#eef6fd] px-3 py-1 text-xs font-medium text-[#376281]">
          {location}
        </span>
      ) : null}
      {employmentType ? (
        <span className="rounded-full bg-[#eef6fd] px-3 py-1 text-xs font-medium text-[#376281]">
          {employmentType}
        </span>
      ) : null}
      {salaryRange ? (
        <span className="rounded-full bg-[#eef6fd] px-3 py-1 text-xs font-medium text-[#376281]">
          {salaryRange}
        </span>
      ) : null}
    </div>
  );
}
