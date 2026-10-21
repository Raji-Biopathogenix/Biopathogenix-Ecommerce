import Image from "next/image";
import { Poppins } from "next/font/google";
import { ArrowRight, CircleCheck, FileText, FlaskConical, Sprout } from "lucide-react";
import { fetchOpenRolesData } from "@/lib/careers";
import OpenPositionsSection from "@/components/careers/OpenPositionsSection";
import ResumeApplyButton from "@/components/careers/ResumeApplyButton";
import {
  filterRolesByDepartment,
  normalizeDepartmentKey,
  sortRolesByOrder,
} from "@/components/careers/careersUtils";
import styles from "@/components/careers/careers.module.css";

export const dynamic = "force-dynamic";

// The Figma design's typeface.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const whyCards = [
  {
    Icon: FlaskConical,
    title: "Meaningful Work",
    text: "Contribute directly to work that supports laboratories, researchers, and better scientific outcomes.",
  },
  {
    Icon: Sprout,
    title: "Grow With Us",
    text: "Take ownership, learn quickly, and grow your responsibilities as the company expands.",
  },
  {
    Icon: FileText,
    title: "High Standards",
    text: "Work with a team that values precision, consistency, and doing the details well.",
  },
];

const lifeChecks = [
  "Small, collaborative teams",
  "Clear ownership and accountability",
  "Direct exposure to meaningful work",
];

const steps = [
  { title: "Apply", text: "Send your application and relevant experience." },
  { title: "Conversation", text: "A short intro call to discuss fit and expectations." },
  { title: "Meet the team", text: "Talk with the people you may work with directly." },
  { title: "Offer", text: "If it’s a match, we move quickly and clearly." },
];

function ButtonArrow() {
  return (
    <span className={styles.buttonArrow} aria-hidden="true">
      <ArrowRight />
    </span>
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
    { label: "All", value: "ALL", count: sortedRoles.length },
    ...departments.map((item) => ({
      label: item,
      value: item,
      count: filterRolesByDepartment(sortedRoles, item).length,
    })),
  ];
  const roleCount = `${sortedRoles.length} open ${sortedRoles.length === 1 ? "role" : "roles"} in Nicholasville, KY —`;

  return (
    <main className={`${poppins.className} ${styles.page}`}>
      {/* ================= HERO ================= */}
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Careers at BioPathogenix</p>
          <h1>
            Meaningful work in <span>molecular science</span>
          </h1>
          <p className={styles.copy}>
            Join a team helping laboratories and researchers move faster with reliable molecular
            solutions and high standards of execution.
          </p>
          <div className={styles.heroActions}>
            <a href="#open-positions" className={styles.button}>
              Explore Open Roles
              <ButtonArrow />
            </a>
            <a href="#life-at-bpx" className={`${styles.button} ${styles.buttonOutline}`}>
              Life at BPX
              <ButtonArrow />
            </a>
          </div>
          <p className={styles.note}>
            <span aria-hidden="true" />
            <span>{roleCount}</span>
            <a href="#open-positions">See them</a>
          </p>
        </div>
        <div className={styles.heroPhoto}>
          <Image src="/images/carrer/careers-hero.webp" alt="Scientists working in the BioPathogenix laboratory" fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover" priority />
        </div>
      </section>

      {/* ================= OPEN POSITIONS (roles from the careers API) ================= */}
      <OpenPositionsSection
        selectedDepartment={selectedDepartment}
        selectedRoles={selectedRoles}
        departmentFilters={departmentFilters}
        allRoles={sortedRoles}
      />

      <div className={styles.band}>
        <img src="/images/figma/dna-blur.webp" alt="" className={styles.bandDna} aria-hidden="true" />
        <img src="/images/figma/dna-blur.webp" alt="" className={styles.bandDna} aria-hidden="true" />
        <div className={styles.bandBallStick} aria-hidden="true" />
        <div className={styles.bandGlow} aria-hidden="true" />

        {/* ================= WHY BIOPATHOGENIX ================= */}
        <section className={styles.why}>
          <p className={styles.eyebrow}>Why BioPathogenix</p>
          <h2 className={styles.h2}>
            Build your career <span>around</span>
            <br />
            <span>meaningful work</span>
          </h2>
          <div className={styles.cards}>
            {whyCards.map(({ Icon, title, text }) => (
              <div key={title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <Icon strokeWidth={1.75} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= LIFE AT BPX ================= */}
        <section id="life-at-bpx" className={styles.life}>
          <div>
            <p className={styles.eyebrow}>Life at BPX</p>
            <h2 className={styles.h2}>
              High standards.
              <br />
              Strong people.
              <br />
              <span>Real momentum.</span>
            </h2>
            <p className={styles.copy}>
              Day to day, that means close collaboration, scientific rigor, and real ownership—working
              alongside the people who keep laboratories moving.
            </p>
            <ul className={`${styles.checks} ${styles.copy}`}>
              {lifeChecks.map((item) => (
                <li key={item}>
                  <CircleCheck aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.lifePhoto}>
            <Image src="/images/carrer/life-at-bpx.webp" alt="Scientist checking a sample vial in the laboratory" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </section>

        {/* ================= HIRING PROCESS ================= */}
        <section className={styles.process}>
          <p className={styles.eyebrow}>What to expect</p>
          <h2 className={styles.h2}>
            A simple, transparent
            <br />
            <span>hiring process</span>
          </h2>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title} className={`${styles.step} ${index ? styles.stepMuted : ""}`}>
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* ================= DON'T SEE YOUR ROLE? ================= */}
      <section id="apply" className={styles.cta}>
        <div className={styles.ctaImage}>
          <Image src="/images/carrer/careers-cta-dna.webp" alt="" fill sizes="(min-width: 1024px) 69vw, 100vw" className="object-cover" />
        </div>
        <div>
          <p className={styles.eyebrow}>Don’t see your role?</p>
          <h2>
            We’re always
            <br />
            interested in meeting
            <br />
            <span>talented people</span>
          </h2>
          <p className={styles.copy}>
            Send us your resume and we’ll keep you in mind when relevant opportunities become available.
          </p>
          <ResumeApplyButton roles={sortedRoles} className={`${styles.button} ${styles.buttonLight}`}>
            Submit your Resume
            <ButtonArrow />
          </ResumeApplyButton>
        </div>
      </section>
    </main>
  );
}
