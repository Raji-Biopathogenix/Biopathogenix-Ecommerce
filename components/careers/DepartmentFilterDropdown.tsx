"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { normalizeDepartmentKey } from "@/components/careers/careersUtils";

type DepartmentFilterDropdownProps = {
  departments: string[];
  selectedDepartment: string;
  anchorId?: string;
};

export default function DepartmentFilterDropdown({
  departments,
  selectedDepartment,
  anchorId = "quick-open-positions",
}: DepartmentFilterDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(
    () => [{ label: "All Positions", value: "ALL" }, ...departments.map((item) => ({ label: item, value: item }))],
    [departments]
  );

  const selectedLabel =
    options.find(
      (item) => normalizeDepartmentKey(item.value) === normalizeDepartmentKey(selectedDepartment)
    )?.label ?? "All Positions";

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function navigateToDepartment(value: string) {
    const query = value === "ALL" ? "" : `?department=${encodeURIComponent(value)}`;
    router.push(`${pathname}${query}#${anchorId}`);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-[38px] items-center gap-2 rounded-full border border-[#c7dced] bg-[#f5fbff] px-4 text-sm font-semibold text-[#1f5079] hover:bg-[#eaf5fe]"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {selectedLabel}
        <span className="text-xs text-[#4b6f89]">▼</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-[280px] overflow-hidden rounded-lg border border-[#d3e2ef] bg-white shadow-[0_14px_26px_rgba(15,63,116,0.14)]">
          {options.map((item) => {
            const isActive =
              normalizeDepartmentKey(item.value) === normalizeDepartmentKey(selectedDepartment);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => navigateToDepartment(item.value)}
                className={`block w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive ? "bg-[#0d3f74] text-white" : "text-[#245575] hover:bg-[#eef7ff]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
