"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, MapPin } from "lucide-react";

import { CareerOpenRole } from "@/lib/careers";
import {
  getRoleActionHref,
  normalizeDepartmentKey,
  roleAnchorId,
  stripHtml,
  toPreviewText,
  toTitleCase,
} from "@/components/careers/careersUtils";
import ResumeApplyButton from "@/components/careers/ResumeApplyButton";
import styles from "@/components/careers/careers.module.css";

type DepartmentFilter = {
  label: string;
  value: string;
  count: number;
};

type OpenPositionsSectionProps = {
  selectedDepartment: string;
  selectedRoles: CareerOpenRole[];
  departmentFilters: DepartmentFilter[];
  /** All open roles across departments, for the summary line and the resume form. */
  allRoles: CareerOpenRole[];
};

export default function OpenPositionsSection({
  selectedDepartment,
  selectedRoles,
  departmentFilters,
  allRoles,
}: OpenPositionsSectionProps) {
  const totalRoles = allRoles.length;
  const [query, setQuery] = useState("");

  // Search narrows the roles already loaded for the selected department.
  const visibleRoles = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return selectedRoles;
    return selectedRoles.filter((role) =>
      [role.title, role.department, role.location, role.short_description, stripHtml(role.description)]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(term))
    );
  }, [query, selectedRoles]);

  return (
    <section id="open-positions" className={styles.positions}>
      <p className={styles.eyebrow}>Open positions</p>
      <h2 className={styles.h2}>
        Find your next <span>opportunity at BioPathogenix</span>
      </h2>
      <p className={styles.copy}>
        Explore current opportunities and find the role that best matches your experience.
      </p>

      <div className={styles.filters}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Roles"
          aria-label="Search roles"
          className={styles.search}
        />
        {departmentFilters.map((item) => {
          const isActive = normalizeDepartmentKey(item.value) === normalizeDepartmentKey(selectedDepartment);
          return (
            <Link
              key={item.value}
              href={
                item.value === "ALL"
                  ? "/about/careers#open-positions"
                  : `/about/careers?department=${encodeURIComponent(item.value)}#open-positions`
              }
              aria-current={isActive ? "true" : undefined}
              className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
            >
              {item.value === "ALL" ? item.label : toTitleCase(item.label)}
              <span>{String(item.count).padStart(2, "0")}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.divider} />

      {visibleRoles.length ? (
        <div className={styles.roles}>
          {visibleRoles.map((role) => {
            const href = getRoleActionHref(role);
            return (
              <article key={`${role.id}-${role.title}`} id={roleAnchorId(role.id)} className={styles.role}>
                <div className={styles.roleBody}>
                  <p className={styles.eyebrow}>{role.department || "General"}</p>
                  <h3>{role.title}</h3>
                  {(role.location || role.employment_type) && (
                    <p className={styles.roleMeta}>
                      {role.location && (
                        <span>
                          <MapPin aria-hidden="true" />
                          <span>{role.location}</span>
                        </span>
                      )}
                      {role.employment_type && (
                        <span>
                          <Clock aria-hidden="true" />
                          <span>{role.employment_type}</span>
                        </span>
                      )}
                    </p>
                  )}
                  <p className={styles.copy}>
                    {toPreviewText(role.short_description || role.description, 160) ||
                      "Role details are available on the next page."}
                  </p>
                </div>
                <div className={styles.roleFoot}>
                  <Link href={href}>View Role</Link>
                  <span>{href}</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className={`${styles.copy} ${styles.empty}`}>
          {query ? "No roles match your search." : "No active jobs in this department right now."}
        </p>
      )}

      <div className={styles.positionsFoot}>
        <p className={styles.note}>
          <span aria-hidden="true" />
          <span>
            {totalRoles} open {totalRoles === 1 ? "role" : "roles"} in Nicholasville, KY
          </span>
        </p>
        <ResumeApplyButton roles={allRoles} className={styles.button}>
          Don&apos;t see a fit? Submit your resume
          <span className={styles.buttonArrow} aria-hidden="true">
            <ArrowRight />
          </span>
        </ResumeApplyButton>
      </div>
    </section>
  );
}
