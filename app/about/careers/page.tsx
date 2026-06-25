import Image from "next/image";
import Link from "next/link";
import { fetchOpenRolesData } from "@/lib/careers";
import OpenPositionsSection from "@/components/careers/OpenPositionsSection";
import QuickOpenPositionsSection from "@/components/careers/QuickOpenPositionsSection";
import {
  filterRolesByDepartment,
  normalizeDepartmentKey,
  sortRolesByOrder,
} from "@/components/careers/careersUtils";

export const dynamic = "force-dynamic";

const careerImages = {
  centrifugeTeam: "/images/carrer/2.png",
  labTeam: "/images/carrer/Blog-Placeholder-Image-1.jpg",
  tissueDesk: "/images/carrer/man-feeling-sick-2024-11-27-11-32-10-utc-1000x667.jpg",
  pipette: "/images/carrer/Pipette-Tips-1-1.jpg",
};

const standardsBullets = [
  "Improve the way work gets done",
  "Build repeatable systems",
  "Solve real problems without drama",
  "Create results that stand up under pressure",
];

const peopleBullets = [
  "Value clean, organized workflows",
  "Learn quickly and document thoroughly",
  "Communicate directly and respectfully",
  "Care about quality and continuous improvement",
  "Want to build systems that scale",
];

const whyBullets = [
  "Precision",
  "Accountability",
  "Consistency",
  "Scientific respect",
  "A culture of follow-through",
];

const expectedItems = [
  "A team that values competence and consistency",
  "Clear priorities and meaningful work",
  "Opportunity to grow into ownership and leadership",
  "A culture that rewards initiative + craftsmanship",
  "Fast execution without cutting corners",
];

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-[#9ed5f3] px-4 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#6aa6c8]">
      {children}
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-[#36566f]">
          <span className="mt-1 h-4 w-4 rounded-full border border-[#87a8bf] text-center text-[10px] leading-[14px] text-[#87a8bf]">
            &bull;
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function CareersPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department } = await searchParams;
  const { departments, roles } = await fetchOpenRolesData();

  const normalizedSelected = normalizeDepartmentKey(department || "ALL");
  const selectedDepartment =
    departments.find((item) => normalizeDepartmentKey(item) === normalizedSelected) || "ALL";
  const sortedRoles = sortRolesByOrder(roles);
  const selectedRoles = filterRolesByDepartment(sortedRoles, selectedDepartment);
  const departmentFilters = [
    { label: "All Positions", value: "ALL" },
    ...departments.map((item) => ({ label: item, value: item })),
  ];

  return (
    <main className="bg-[#f3f4f6] py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-3 sm:px-5 lg:px-8 xl:px-10">
        <section className="relative overflow-hidden rounded-lg">
          <Image
            src={careerImages.pipette}
            alt="Pipette-Tips-1-1.jpg"
            width={1200}
            height={520}
            className="h-[390px] w-full object-cover sm:h-[430px]"
            priority
          />
          <div className="absolute inset-0 bg-[#0b4f86]/75" />
          <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
            <div className="max-w-[760px]">
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Serious About PCR?
                <br />
                So Are We
              </h1>
              <p className="mt-5 text-sm leading-7 text-[#d4e8f8] sm:text-base">
                At BioPathogenix, we support scientists and research teams with RUO workflows
                designed for speed, precision, and reliability.
              </p>
              <p className="mt-2 text-sm leading-7 text-[#d4e8f8] sm:text-base">
                If you thrive in high standards, clean execution, and meaningful work, you&apos;ll
                feel at home here.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="#open-positions"
                  className="rounded bg-[#0d3f74] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3561]"
                >
                  View Open Roles
                </Link>
                <Link
                  href="#apply"
                  className="rounded bg-[#4aa7f0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3397e7]"
                >
                  Submit Your Resume
                </Link>
              </div>
            </div>
          </div>
        </section>

        <QuickOpenPositionsSection
          departments={departments}
          selectedDepartment={selectedDepartment}
          roles={selectedRoles}
        />

        <section className="grid gap-7 lg:grid-cols-[1.06fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-md">
            <Image
              src={careerImages.pipette}
              alt="Pipette-Tips-1-1.jpg team workspace"
              width={640}
              height={420}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-semibold leading-[1.06] text-[#1a4f7b] sm:text-[46px]">
              Why BioPathogenix
            </h2>
            <p className="font-semibold text-[#245575]">Work that matters. Standards that don&apos;t bend</p>
            <p className="text-sm leading-7 text-[#3a5f78]">
              BioPathogenix exists to strengthen the pace and confidence of research. That means
              we move fast, but never carelessly. We build with intention, validate with
              discipline, and support our customers like the outcome matters because it does.
            </p>
            <p className="font-semibold text-[#245575]">We&apos;re a team built around:</p>
            <BulletList items={whyBullets} />
          </div>
        </section>

        <section className="rounded-lg bg-[#bfeefe] px-6 py-10 text-center sm:px-8">
          <Tag>WHAT WE LOOK FOR</Tag>
          <h3 className="mt-4 text-4xl font-semibold leading-[1.1] text-[#1c4f78] sm:text-[50px]">
            People who take pride in
            <br />
            doing it right.
          </h3>
          <p className="mx-auto mt-4 max-w-[760px] text-sm leading-7 text-[#376281] sm:text-base">
            We&apos;re looking for individuals who don&apos;t just &quot;show up&quot; but bring clarity, ownership, and
            real craft to their work.
          </p>
          <div className="mx-auto mt-5 grid max-w-[960px] gap-2 text-left sm:grid-cols-2 lg:grid-cols-3">
            {peopleBullets.map((item) => (
              <p key={item} className="flex items-start gap-2 text-sm text-[#2f5874]">
                <span className="mt-1 h-4 w-4 rounded-full border border-[#89a9c1] text-center text-[10px] leading-[14px] text-[#89a9c1]">
                  &bull;
                </span>
                <span>{item}</span>
              </p>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="#open-positions"
              className="rounded bg-[#0d3f74] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3561]"
            >
              View Open Roles
            </Link>
            <Link
              href="#apply"
              className="rounded bg-[#4aa7f0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3397e7]"
            >
              Submit Your Resume
            </Link>
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <Tag>LIFE AT BPX</Tag>
            <h3 className="text-5xl font-semibold leading-[1.06] text-[#1a4f7b] sm:text-[52px]">
              High standards. Strong people.
              <br />
              Real momentum.
            </h3>
            <p className="text-sm leading-7 text-[#3a5f78]">
              Our work supports laboratories and research environments where timelines matter and
              reliability isn&apos;t optional.
            </p>
            <p className="text-sm leading-7 text-[#3a5f78]">
              So internally, we build the same way: clear expectations, strong training, and a
              team culture that protects momentum.
            </p>
            <p className="font-semibold text-[#245575]">This is a place for people who want to:</p>
            <BulletList items={standardsBullets} />
          </div>
          <div className="overflow-hidden rounded-md">
            <Image
              src={careerImages.labTeam}
              alt="Blog-Placeholder-Image-1.jpg collaborative lab team"
              width={660}
              height={430}
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="rounded-lg bg-[#e9edf6] px-6 py-10 text-center sm:px-8">
          <Tag>WHAT YOU CAN EXPECT</Tag>
          <h3 className="mx-auto mt-4 max-w-[760px] text-4xl font-semibold leading-[1.1] text-[#1c4f78] sm:text-[50px]">
            Clarity, growth, and a team
            <br />
            that respects excellence.
          </h3>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {expectedItems.map((item) => (
              <div key={item} className="space-y-2 text-center">
                <span className="mx-auto block h-8 w-8 rounded-full border border-[#8cb1cb]" />
                <p className="text-sm leading-6 text-[#2f5874]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1fr_1.2fr] lg:items-center">
          <div className="space-y-4">
            <Tag>OUTSIDE THE LAB</Tag>
            <h3 className="text-[34px] font-semibold leading-[1.16] text-[#1a4f7b] sm:text-[44px] lg:text-[56px]">
              Strong teams
              <br />
              are built beyond
              <br />
              the workspace.
            </h3>
          </div>

          <div className="relative overflow-hidden rounded-lg">
            <Image
              src={careerImages.centrifugeTeam}
              alt="2.png team culture image"
              width={700}
              height={560}
              className="h-full w-full object-cover"
            />
            <div className="absolute left-0 top-1/2 hidden h-[200px] w-[96px] -translate-x-[52%] -translate-y-1/2 bg-[#f3f4f6] [clip-path:polygon(0_0,100%_50%,0_100%)] lg:block" />
          </div>

          <div className="space-y-4">
            <h4 className="text-[28px] font-semibold leading-[1.22] text-[#1f5079] sm:text-[34px] lg:text-[46px]">
              We take our work seriously, but we don&apos;t build relationships only at work
            </h4>
            <p className="text-[16px] leading-8 text-[#3a5f78]">
              At BioPathogenix, we regularly step away from the lab and office to connect as
              people. Because trust isn&apos;t built in meetings. It&apos;s built in shared experiences.
            </p>
            <BulletList
              items={[
                "We celebrate wins.",
                "We recognize effort.",
                "We make space to laugh, and to refresh.",
              ]}
            />
            <p className="text-[16px] leading-8 text-[#3a5f78]">
              The result? A team that communicates better, collaborates stronger, and shows up for
              each other when the pressure is on.
            </p>
            <p className="text-[18px] font-semibold text-[#245575]">
              High standards. Real connection. Both matter here.
            </p>
          </div>
        </section>

        <OpenPositionsSection
          selectedDepartment={selectedDepartment}
          selectedRoles={selectedRoles}
          departmentFilters={departmentFilters}
          tag={<Tag>OPEN ROLES</Tag>}
        />

        <section className="grid gap-7 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-md">
            <Image
              src={careerImages.tissueDesk}
              alt="man-feeling-sick-2024-11-27-11-32-10-utc-1000x667.jpg"
              width={700}
              height={430}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-4">
            <Tag>DON&apos;T SEE THE ROLE YET?</Tag>
            <h3 className="text-[38px] font-semibold leading-[1.12] text-[#1a4f7b] sm:text-[46px]">
              We&apos;re always open to the right person.
            </h3>
            <p className="text-sm leading-7 text-[#3a5f78]">
              If you don&apos;t see a listed position that fits your background, you can still submit
              your resume.
            </p>
            <p className="text-sm leading-7 text-[#3a5f78]">
              We review strong candidates and keep exceptional talent on file as we expand.
            </p>
            <p className="font-semibold text-[#245575]">This is a place for people who want to:</p>
            <BulletList items={standardsBullets} />
          </div>
        </section>

        <section
          id="apply"
          className="relative overflow-hidden rounded-lg px-6 py-16 text-center sm:px-8"
        >
          <Image
            src={careerImages.pipette}
            alt="Pipette-Tips-1-1.jpg background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0e3a68]/90" />
          <div className="relative mx-auto max-w-[720px]">
            <Tag>STANDARD ALWAYS</Tag>
            <h3 className="mt-4 text-5xl font-semibold leading-[1.08] text-white sm:text-[56px]">
              Ready to build something
              <br />
              meaningful?
            </h3>
            <p className="mt-4 text-sm leading-7 text-[#d4e8f8] sm:text-base">
              If you&apos;re driven by quality, precision, and impact there&apos;s a place for you here.
            </p>
            <Link
              href="/about/careers#open-positions"
              className="mt-7 inline-flex rounded bg-[#4aa7f0] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#3397e7]"
            >
              Apply Now
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
