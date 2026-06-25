"use client";

import { FormEvent, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api";

const HELP_OPTIONS = [
  "Custom assay development",
  "Existing assay recommendation",
  "Multiplex design",
  "Troubleshooting/Technical Support",
] as const;

type HelpOption = (typeof HELP_OPTIONS)[number];

type AssayInquiryRequest = {
  name: string;
  work_email: string;
  organization_lab: string;
  help_type: HelpOption | "";
  additional_details: string;
};

type AssayInquiryResponse = {
  message?: string;
};

export default function AssayInquiryForm() {
  const [form, setForm] = useState<AssayInquiryRequest>({
    name: "",
    work_email: "",
    organization_lab: "",
    help_type: "",
    additional_details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.work_email.trim() &&
      form.organization_lab.trim() &&
      form.help_type
    );
  }, [form]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchJson<AssayInquiryResponse>("/assay-inquiry/", {
        method: "POST",
        body: form,
      });

      setSuccess(response.message || "Your inquiry has been submitted.");
      setForm({
        name: "",
        work_email: "",
        organization_lab: "",
        help_type: "",
        additional_details: "",
      });
    } catch (submitError) {
      console.error("Failed to submit assay inquiry form", submitError);
      setError("Unable to submit right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#1f4f79]">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
          className="h-11 w-full rounded-md border border-[#d4e3ef] px-3 text-sm outline-none focus:border-[#73b9e8]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#1f4f79]">
          Work Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={form.work_email}
          onChange={(event) => setForm((prev) => ({ ...prev, work_email: event.target.value }))}
          required
          className="h-11 w-full rounded-md border border-[#d4e3ef] px-3 text-sm outline-none focus:border-[#73b9e8]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#1f4f79]">
          Organization / Lab <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.organization_lab}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              organization_lab: event.target.value,
            }))
          }
          required
          className="h-11 w-full rounded-md border border-[#d4e3ef] px-3 text-sm outline-none focus:border-[#73b9e8]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#1f4f79]">
          What do you need help with? <span className="text-red-500">*</span>
        </label>
        <select
          value={form.help_type}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              help_type: event.target.value as HelpOption,
            }))
          }
          required
          className="h-11 w-full rounded-md border border-[#d4e3ef] bg-white px-3 text-sm outline-none focus:border-[#73b9e8]"
        >
          <option value="">Select an option</option>
          {HELP_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#1f4f79]">Additional Details (Optional)</label>
        <textarea
          rows={5}
          value={form.additional_details}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              additional_details: event.target.value,
            }))
          }
          className="w-full rounded-md border border-[#d4e3ef] px-3 py-2 text-sm outline-none focus:border-[#73b9e8]"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !canSubmit}
        className="inline-flex items-center gap-2 rounded-md bg-[#148fda] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f77b7] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Inquiry"}
      </button>
    </form>
  );
}
