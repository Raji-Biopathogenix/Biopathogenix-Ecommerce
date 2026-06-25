"use client";

import { FormEvent, useState } from "react";
import { submitCareerApplication } from "@/lib/careers";

type CareerApplyFormProps = {
  roleId: number;
  roleTitle: string;
};

export default function CareerApplyForm({ roleId, roleTitle }: CareerApplyFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [message, setMessage] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!resume) {
      setErrorMessage("Please upload your resume.");
      return;
    }

    const formData = new FormData();
    formData.append("role", String(roleId));
    formData.append("full_name", fullName.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    formData.append("linkedin_url", linkedinUrl.trim());
    formData.append("message", message.trim());
    formData.append("resume", resume);

    setIsSubmitting(true);
    try {
      const response = await submitCareerApplication(formData);
      setSuccessMessage(response?.message || "Application submitted successfully.");
      setFullName("");
      setEmail("");
      setPhone("");
      setLinkedinUrl("");
      setMessage("");
      setResume(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit application.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#dbe6ef] bg-white p-5 shadow-sm">
      <h3 className="text-xl font-semibold text-[#1c4f78]">Apply For {roleTitle}</h3>
      <p className="mt-1 text-sm text-[#4a6275]">
        Submit your resume and details. Our team will review and contact you.
      </p>

      <div className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          className="w-full rounded-md border border-[#c8d8e5] px-3 py-2 text-sm outline-none focus:border-[#4aa7f0]"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="w-full rounded-md border border-[#c8d8e5] px-3 py-2 text-sm outline-none focus:border-[#4aa7f0]"
        />
        <input
          type="text"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-md border border-[#c8d8e5] px-3 py-2 text-sm outline-none focus:border-[#4aa7f0]"
        />
        <input
          type="url"
          placeholder="LinkedIn URL (optional)"
          value={linkedinUrl}
          onChange={(event) => setLinkedinUrl(event.target.value)}
          className="w-full rounded-md border border-[#c8d8e5] px-3 py-2 text-sm outline-none focus:border-[#4aa7f0]"
        />
        <textarea
          placeholder="Message (optional)"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-[#c8d8e5] px-3 py-2 text-sm outline-none focus:border-[#4aa7f0]"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2e526f]">Upload Resume</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(event) => setResume(event.target.files?.[0] ?? null)}
            required
            className="w-full rounded-md border border-[#c8d8e5] px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-[#5c768a]">Accepted formats: PDF, DOC, DOCX (max 5MB)</p>
        </div>
      </div>

      {successMessage ? <p className="mt-3 text-sm text-green-700">{successMessage}</p> : null}
      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full rounded-md bg-[#0d3f74] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3561] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Apply Now"}
      </button>
    </form>
  );
}
