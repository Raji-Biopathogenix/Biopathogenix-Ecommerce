import Link from "next/link";

import { CareerOpenRole } from "@/lib/careers";
import RoleMetaChips from "@/components/careers/RoleMetaChips";
import { toPreviewText } from "@/components/careers/careersUtils";

type CareerRoleCardProps = {
  role: CareerOpenRole;
  id?: string;
  titleHref?: string;
  actionHref: string;
  actionLabel?: string;
  summaryMaxLength?: number;
};

export default function CareerRoleCard({
  role,
  id,
  titleHref,
  actionHref,
  actionLabel = "Apply",
  summaryMaxLength = 240,
}: CareerRoleCardProps) {
  return (
    <article
      id={id}
      className="scroll-mt-28 rounded-xl border border-[#d7e4ec] bg-white p-4 shadow-[0_10px_16px_rgba(15,63,116,0.10)] sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.13em] text-[#5581a0]">
            {(role.department || "GENERAL").toUpperCase()}
          </p>

          {titleHref ? (
            <Link
              href={titleHref}
              className="mt-2 block text-[22px] font-semibold leading-7 text-[#1f5079] hover:text-[#0d3f74]"
            >
              {role.title}
            </Link>
          ) : (
            <h5 className="mt-2 text-[22px] font-semibold leading-7 text-[#1f5079]">{role.title}</h5>
          )}

          <RoleMetaChips
            className="mt-4"
            location={role.location}
            employmentType={role.employment_type}
            salaryRange={role.salary_range}
          />

          <p className="mt-3 text-sm leading-6 text-[#3a5f78]">
            {toPreviewText(role.short_description || role.description, summaryMaxLength) ||
              "Role details are available on the next page."}
          </p>
        </div>

        <div className="lg:self-end lg:pl-6">
          <Link
            href={actionHref}
            className="inline-flex h-10 min-w-[142px] items-center justify-center rounded bg-[#0d3f74] px-4 text-sm font-semibold text-white hover:bg-[#0a3561] visited:text-white"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
