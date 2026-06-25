import Link from "next/link";

import { normalizeDepartmentKey } from "@/components/careers/careersUtils";

type DepartmentFilter = {
  label: string;
  value: string;
};

type DepartmentPillsProps = {
  filters: DepartmentFilter[];
  selectedDepartment: string;
  anchorId?: string;
};

export default function DepartmentPills({
  filters,
  selectedDepartment,
  anchorId = "open-positions",
}: DepartmentPillsProps) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      {filters.map((item) => {
        const isActive =
          normalizeDepartmentKey(item.value) === normalizeDepartmentKey(selectedDepartment);

        return (
          <Link
            key={item.value}
            href={
              item.value === "ALL"
                ? `/about/careers#${anchorId}`
                : `/about/careers?department=${encodeURIComponent(item.value)}#${anchorId}`
            }
            className={`inline-flex min-h-[44px] items-center rounded-full border px-5 text-sm font-semibold tracking-[0.02em] shadow-[0_8px_14px_rgba(15,63,116,0.12)] transition-colors ${
              isActive
                ? "border-[#0d3f74] bg-[#0d3f74] text-white"
                : "border-[#d7e4ec] bg-white text-[#27557a] hover:bg-[#f5fbff]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
