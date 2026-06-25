import Link from "next/link";
import { notFound } from "next/navigation";
import CareerApplyForm from "@/components/careers/CareerApplyForm";
import { fetchOpenRoleBySlug } from "@/lib/careers";

export const dynamic = "force-dynamic";

function SectionBlock({ title, content }: { title: string; content?: string }) {
  if (!content?.trim()) {
    return null;
  }

  return (
    <section className="rounded-lg border border-[#dbe6ef] bg-white p-5">
      <h2 className="text-base font-semibold tracking-wide text-[#1c4f78]">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#2f5874]">{content}</p>
    </section>
  );
}

export default async function CareerRolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = await fetchOpenRoleBySlug(slug);

  if (!role) {
    notFound();
  }

  return (
    <main className="bg-[#f3f4f6] py-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <Link
          href="/about/careers"
          className="mb-4 inline-flex text-sm font-semibold text-[#1f5f91] hover:text-[#0d3f74]"
        >
          {"<- View all jobs"}
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <section className="rounded-lg border border-[#dbe6ef] bg-white p-5">
              <h1 className="text-[32px] font-semibold leading-tight text-[#1a4f7b] sm:text-[40px]">
                {role.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#4d6c83]">
                {role.location ? (
                  <span className="rounded-full border border-[#d2e2ee] px-3 py-1">{role.location}</span>
                ) : null}
                {role.department ? (
                  <span className="rounded-full border border-[#d2e2ee] px-3 py-1">{role.department}</span>
                ) : null}
                {role.employment_type ? (
                  <span className="rounded-full border border-[#d2e2ee] px-3 py-1">
                    {role.employment_type}
                  </span>
                ) : null}
                {role.salary_range ? (
                  <span className="rounded-full border border-[#d2e2ee] px-3 py-1">{role.salary_range}</span>
                ) : null}
              </div>
              {role.short_description ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#36566f]">
                  {role.short_description}
                </p>
              ) : null}
            </section>

            <SectionBlock title="Job Description" content={role.description} />
            <SectionBlock title="Responsibilities" content={role.responsibilities} />
            <SectionBlock title="Requirements" content={role.requirements} />
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <CareerApplyForm roleId={role.id} roleTitle={role.title} />
          </div>
        </div>
      </div>
    </main>
  );
}
