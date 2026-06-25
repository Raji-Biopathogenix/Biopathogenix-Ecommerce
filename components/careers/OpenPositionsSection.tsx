import type { ReactNode } from "react";

import CareerRoleCard from "@/components/careers/CareerRoleCard";
import DepartmentPills from "@/components/careers/DepartmentPills";
import { CareerOpenRole } from "@/lib/careers";
import { getRoleActionHref, roleAnchorId } from "@/components/careers/careersUtils";

type DepartmentFilter = {
  label: string;
  value: string;
};

type OpenPositionsSectionProps = {
  selectedDepartment: string;
  selectedRoles: CareerOpenRole[];
  departmentFilters: DepartmentFilter[];
  tag: ReactNode;
};

export default function OpenPositionsSection({
  selectedDepartment,
  selectedRoles,
  departmentFilters,
  tag,
}: OpenPositionsSectionProps) {
  return (
    <section id="open-positions" className="scroll-mt-28 rounded-lg bg-[#bfeefe] px-6 py-10 sm:px-8">
      {tag}
      <h3 className="mt-4 text-center text-5xl font-semibold leading-[1.06] text-[#1c4f78] sm:text-[58px]">
        Open Positions
      </h3>
      <p className="mx-auto mt-4 max-w-[760px] text-center text-sm leading-7 text-[#376281] sm:text-base">
        Explore opportunities across Administration, Research &amp; Development, Regulatory
        Affairs, Operations and more.
      </p>
      <p className="mx-auto mt-2 max-w-[760px] text-center text-sm leading-7 text-[#376281] sm:text-base">
        Each role at BPX is designed to contribute directly to real outcomes and we hire people
        who take that responsibility seriously.
      </p>

      <div className="mt-8">
        <h4 className="text-center text-[20px] font-semibold text-[#1c4f78] sm:text-[24px]">
          Departments
        </h4>
        <DepartmentPills
          filters={departmentFilters}
          selectedDepartment={selectedDepartment}
          anchorId="open-positions"
        />
      </div>

      <div className="mt-10 text-left">
        <h4 className="text-[24px] font-semibold text-[#1c4f78] sm:text-[30px]">
          {selectedDepartment === "ALL" ? "All Open Positions" : `${selectedDepartment} Roles`}
        </h4>

        {selectedRoles.length ? (
          <div className="mt-5 flex flex-col gap-3.5">
            {selectedRoles.map((role) => (
              <CareerRoleCard
                key={`${role.id}-${role.title}`}
                role={role}
                id={roleAnchorId(role.id)}
                actionHref={getRoleActionHref(role)}
                actionLabel="Apply"
                summaryMaxLength={240}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#376281]">
            No active jobs in this department right now.
          </p>
        )}
      </div>
    </section>
  );
}
