"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Poppins } from "next/font/google";
import { X } from "lucide-react";

import { CAREER_DEPARTMENTS_FALLBACK, CareerOpenRole, submitCareerApplication } from "@/lib/careers";
import { normalizeDepartmentKey, toTitleCase } from "@/components/careers/careersUtils";
import styles from "@/components/careers/careers.module.css";

// The popup renders on <body>, outside the page's font, so it sets the Figma typeface itself.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_TYPES = [".pdf", ".doc", ".docx"];

type ResumeApplyButtonProps = {
  /** Open roles from the careers API; each application must be filed under one. */
  roles: CareerOpenRole[];
  className: string;
  children: ReactNode;
};

export default function ResumeApplyButton({ roles, className, children }: ResumeApplyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setIsOpen(true)}>
        {children}
      </button>
      {/* Rendered on <body> so the buttons' section styles (dark CTA headings) don't reach it. */}
      {isOpen && createPortal(<ResumeModal roles={roles} onClose={() => setIsOpen(false)} />, document.body)}
    </>
  );
}

function ResumeModal({ roles, onClose }: { roles: CareerOpenRole[]; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const resume = data.get("resume");
    const department = String(data.get("department") || "");

    if (!(resume instanceof File) || !resume.name) {
      setErrorMessage("Please attach your resume.");
      return;
    }
    if (!RESUME_TYPES.some((ext) => resume.name.toLowerCase().endsWith(ext))) {
      setErrorMessage("Please attach a PDF or Word document (.pdf, .doc, .docx).");
      return;
    }
    if (resume.size > MAX_RESUME_BYTES) {
      setErrorMessage("Resume file size must be 5MB or less.");
      return;
    }

    // File it under an open role in the chosen department when there is one; otherwise it is
    // sent without a role as a general application. The details travel in the message.
    const role = roles.find(
      (item) => normalizeDepartmentKey(item.department || "") === normalizeDepartmentKey(department)
    );

    const payload = new FormData();
    if (role) payload.append("role", String(role.id));
    payload.append("full_name", String(data.get("full_name") || "").trim());
    payload.append("email", String(data.get("email") || "").trim());
    payload.append("phone", String(data.get("phone") || "").trim());
    payload.append(
      "message",
      [
        "General resume submission",
        `Department of interest: ${toTitleCase(department)}`,
        `Degree: ${String(data.get("degree") || "").trim()}`,
        `Location: ${String(data.get("location") || "").trim()}`,
      ].join("\n")
    );
    payload.append("resume", resume);

    setIsSubmitting(true);
    try {
      const response = await submitCareerApplication(payload);
      setSuccessMessage(response?.message || "Thank you! Your resume has been submitted.");
      form.reset();
    } catch (error) {
      // A TypeError means the request never reached the server (offline or unreachable).
      setErrorMessage(
        error instanceof TypeError
          ? "We couldn't reach our server. Please try again, or email your resume to careers@biopathogenix.com."
          : error instanceof Error
            ? error.message
            : "Failed to submit your resume."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${poppins.className} ${styles.modalBackdrop}`} role="dialog" aria-modal="true" aria-labelledby="resume-form-title" onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className={styles.modalClose} aria-label="Close form">
          <X />
        </button>
        <p className={styles.eyebrow}>Don&apos;t see your role?</p>
        <h2 id="resume-form-title" className={styles.modalTitle}>
          Submit your <span>Resume</span>
        </h2>
        <p className={styles.copy}>Tell us about yourself and we&apos;ll keep you in mind for relevant opportunities.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Full Name</span>
            <input ref={firstField} name="full_name" type="text" autoComplete="name" required />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className={styles.field}>
            <span>Phone Number</span>
            <input name="phone" type="tel" autoComplete="tel" maxLength={30} required />
          </label>
          <label className={styles.field}>
            <span>Degree</span>
            <input name="degree" type="text" placeholder="e.g. B.S. Molecular Biology" required />
          </label>
          <label className={styles.field}>
            <span>Location</span>
            <input name="location" type="text" autoComplete="address-level2" placeholder="City, State" required />
          </label>
          <label className={styles.field}>
            <span>Department Interested In</span>
            <select name="department" required defaultValue="">
              <option value="" disabled>
                Select a department
              </option>
              {CAREER_DEPARTMENTS_FALLBACK.map((item) => (
                <option key={item} value={item}>
                  {toTitleCase(item)}
                </option>
              ))}
            </select>
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span>Resume (PDF or Word, max 5MB)</span>
            <input name="resume" type="file" accept={RESUME_TYPES.join(",")} required />
          </label>

          {successMessage && <p className={`${styles.fieldWide} ${styles.formSuccess}`}>{successMessage}</p>}
          {errorMessage && <p className={`${styles.fieldWide} ${styles.formError}`}>{errorMessage}</p>}

          <button type="submit" disabled={isSubmitting} className={`${styles.button} ${styles.fieldWide}`}>
            {isSubmitting ? "Submitting..." : "Submit Resume"}
          </button>
        </form>
      </div>
    </div>
  );
}
