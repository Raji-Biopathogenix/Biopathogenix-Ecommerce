"use client";

import { FormEvent, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api";

type AvailabilityRequest = {
  first_name: string;
  last_name: string;
  laboratory: string;
  phone: string;
  message: string;
};

type AvailabilityResponse = {
  message?: string;
};

type AvailabilityFormProps = {
  inModal?: boolean;
  onSubmitted?: () => void;
  showHeading?: boolean;
};

const EMPTY_FORM: AvailabilityRequest = {
  first_name: "",
  last_name: "",
  laboratory: "",
  phone: "",
  message: "",
};

export default function AvailabilityForm({
  inModal = false,
  onSubmitted,
  showHeading = true,
}: AvailabilityFormProps) {
  const [form, setForm] = useState<AvailabilityRequest>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.first_name.trim() &&
      form.last_name.trim() &&
      form.laboratory.trim() &&
      form.phone.trim()
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
      const response = await fetchJson<AvailabilityResponse>("/quality-control-availability/", {
        method: "POST",
        body: form,
      });

      setSuccess(response.message || "Your request has been submitted.");
      setForm(EMPTY_FORM);
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (submitError) {
      console.error("Failed to submit quality control availability form", submitError);
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
        <h2 className="mb-6 text-2xl font-semibold text-[#0B3C5D] md:text-3xl">
          Confirm Availability
        </h2>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#0B3C5D]">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
              required
              className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#0B3C5D]">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
              required
              className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#0B3C5D]">
            Laboratory Name <span className="text-red-500">*</span>
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
          <label className="mb-2 block text-sm font-medium text-[#0B3C5D]">Message</label>
          <textarea
            rows={5}
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
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
