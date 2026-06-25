import DepartmentFilterDropdown from "@/components/careers/DepartmentFilterDropdown";
import CareerRoleCard from "@/components/careers/CareerRoleCard";
import { CareerOpenRole } from "@/lib/careers";
import { getRoleActionHref, roleAnchorId } from "@/components/careers/careersUtils";

type QuickOpenPositionsSectionProps = {
  departments: string[];
  selectedDepartment: string;
  roles: CareerOpenRole[];
};

export default function QuickOpenPositionsSection({
  departments,
  selectedDepartment,
  roles,
}: QuickOpenPositionsSectionProps) {
  return (
    <section
      id="quick-open-positions"
      className="rounded-lg border border-[#d9e6f1] bg-white px-6 py-8 sm:px-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[40px] font-semibold leading-[1.08] text-[#1f5079] sm:text-[46px]">
          Open Positions
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#5c7f99]">
            Filter By Department
          </span>
          <DepartmentFilterDropdown
            departments={departments}
            selectedDepartment={selectedDepartment}
            anchorId="quick-open-positions"
          />
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#486c85]">
        Click a role to jump directly to its detailed card below.
      </p>

      {roles.length ? (
        <div className="mt-6 flex flex-col gap-4">
          {roles.map((role) => (
            <CareerRoleCard
              key={`quick-${role.id}`}
              role={role}
              titleHref={`#${roleAnchorId(role.id)}`}
              actionHref={getRoleActionHref(role)}
              actionLabel="Apply"
              summaryMaxLength={240}
            />
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-[#376281]">No active roles available right now.</p>
      )}
    </section>
  );
}
