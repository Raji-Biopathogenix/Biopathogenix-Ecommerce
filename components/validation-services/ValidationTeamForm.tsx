"use client";

import { FormEvent, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api";

const VALIDATION_OPTIONS = ["CLIA", "COLA", "CAP"] as const;

type ValidationOption = (typeof VALIDATION_OPTIONS)[number];

type ContactValidationRequest = {
  name: string;
  email: string;
  phone: string;
  laboratory: string;
  validating_for: ValidationOption[];
  additional_notes: string;
};

type ContactValidationResponse = {
  message?: string;
};

type ValidationTeamFormProps = {
  inModal?: boolean;
  onSubmitted?: () => void;
  showHeading?: boolean;
};

export default function ValidationTeamForm({
  inModal = false,
  onSubmitted,
  showHeading = true,
}: ValidationTeamFormProps) {
  const [form, setForm] = useState<ContactValidationRequest>({
    name: "",
    email: "",
    phone: "",
    laboratory: "",
    validating_for: [],
    additional_notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.laboratory.trim() &&
      form.validating_for.length > 0
    );
  }, [form]);

  const toggleValidationOption = (option: ValidationOption) => {
    setForm((prev) => {
      const exists = prev.validating_for.includes(option);
      const next = exists
        ? prev.validating_for.filter((item) => item !== option)
        : [...prev.validating_for, option];

      return { ...prev, validating_for: next };
    });
  };

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
      const response = await fetchJson<ContactValidationResponse>("/contact-validation/", {
        method: "POST",
        body: form,
      });

      setSuccess(response.message || "Your request has been submitted.");
      setForm({
        name: "",
        email: "",
        phone: "",
        laboratory: "",
        validating_for: [],
        additional_notes: "",
      });
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (submitError) {
      console.error("Failed to submit validation services form", submitError);
      setError("Unable to submit right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`mx-auto max-w-3xl bg-[#F3FAFE] p-6 md:p-10 ${
        inModal ? "rounded-2xl shadow-none" : "rounded-2xl shadow-sm"
      }`}
    >
      {showHeading && (
        <h2 className="mb-6 text-2xl font-semibold text-[#0B3C5D] md:text-3xl">Contact Validation Team</h2>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0B3C5D]">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0B3C5D]">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
              className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0B3C5D]">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              required
              className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0B3C5D]">
              Laboratory <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.laboratory}
              onChange={(event) => setForm((prev) => ({ ...prev, laboratory: event.target.value }))}
              required
              className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="mb-2 block text-sm font-medium text-[#0B3C5D]">
              Which of the following are you validating for? <span className="text-red-500">*</span>
            </p>
            <div className="space-y-2">
              {VALIDATION_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-[#0B3C5D]">
                  <input
                    type="checkbox"
                    checked={form.validating_for.includes(option)}
                    onChange={() => toggleValidationOption(option)}
                    className="h-4 w-4 rounded border-gray-300 text-[#0B7ACF] focus:ring-blue-500"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0B3C5D]">Additional Notes</label>
            <textarea
              rows={5}
              value={form.additional_notes}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  additional_notes: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="inline-flex items-center justify-center rounded-md bg-[#0B7ACF] px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-[#095f9f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
      </form>
    </div>
  );
}
