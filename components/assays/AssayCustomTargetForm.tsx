"use client";

import { FormEvent, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api";
import type { AssayTypeConfig } from "@/lib/assays";

interface Props {
  config: AssayTypeConfig;
}

type FormState = {
  name: string;
  email: string;
  organization_lab: string;
  targets: string;
  notes: string;
};

type SubmitResponse = {
  message?: string;
};

export default function AssayCustomTargetForm({ config }: Props) {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    organization_lab: "",
    targets: "",
    notes: "",
  });
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return form.name.trim() && form.email.trim() && form.organization_lab.trim() && (form.targets.trim() || targetFile);
  }, [form, targetFile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setError("");

    if (!canSubmit) {
      setError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("organization_lab", form.organization_lab);
      payload.append("panel_type", config.label);
      payload.append("targets", form.targets);
      payload.append("notes", form.notes);
      if (targetFile) {
        payload.append("target_file", targetFile);
      }

      const response = await fetchJson<SubmitResponse>("/custom-target-request/", {
        method: "POST",
        body: payload,
      });
      setMessage(response.message || "Your request has been sent.");
      setForm({
        name: "",
        email: "",
        organization_lab: "",
        targets: "",
        notes: "",
      });
      setTargetFile(null);
      formElement.reset();
    } catch {
      setError("Unable to send the request right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="custom-targets" className="bg-[#f7fbfd] px-6 py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase text-[#1582b8]">Custom targets</p>
          <h2 className="text-3xl font-extrabold leading-tight text-[#0b2e59]">
            Request custom targets for {config.label}
          </h2>
          <p className="mt-4 leading-relaxed text-[#526b7c]">
            Share the organism names, gene targets, or panel idea. Paste the list here or upload a target sheet.
          </p>
        </div>

        <form className="rounded-md border border-[#cfe1ec] bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-[#0b2e59]">
              Name
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-2 h-11 w-full rounded-md border border-[#c9dbe8] px-3 text-sm font-normal outline-none focus:border-[#1582b8]"
                required
              />
            </label>

            <label className="text-sm font-bold text-[#0b2e59]">
              Work Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-2 h-11 w-full rounded-md border border-[#c9dbe8] px-3 text-sm font-normal outline-none focus:border-[#1582b8]"
                required
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-bold text-[#0b2e59]">
            Organization / Lab
            <input
              value={form.organization_lab}
              onChange={(event) => setForm((prev) => ({ ...prev, organization_lab: event.target.value }))}
              className="mt-2 h-11 w-full rounded-md border border-[#c9dbe8] px-3 text-sm font-normal outline-none focus:border-[#1582b8]"
              required
            />
          </label>

          <label className="mt-4 block text-sm font-bold text-[#0b2e59]">
            Target List Text
            <textarea
              value={form.targets}
              onChange={(event) => setForm((prev) => ({ ...prev, targets: event.target.value }))}
              rows={5}
              placeholder="Paste target names, pathogens, genes, or assay notes. You can also upload a target file below."
              className="mt-2 w-full rounded-md border border-[#c9dbe8] px-3 py-2 text-sm font-normal outline-none focus:border-[#1582b8]"
            />
          </label>

          <label className="mt-4 block text-sm font-bold text-[#0b2e59]">
            Upload Target File
            <input
              type="file"
              accept=".xlsx,.xls,.pdf,.doc,.docx,.csv"
              onChange={(event) => setTargetFile(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-md border border-dashed border-[#9fc7dc] bg-[#f7fbfd] px-3 py-3 text-sm font-normal text-[#33485a] outline-none file:mr-4 file:rounded-md file:border-0 file:bg-[#3997d1] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#197bb6]"
            />
          </label>

          <p className="mt-2 text-xs font-semibold text-[#526b7c]">
            Add targets by text, upload Excel/PDF/Word/CSV, or use both. Files can be up to 3 MB.
          </p>

          <label className="mt-4 block text-sm font-bold text-[#0b2e59]">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-md border border-[#c9dbe8] px-3 py-2 text-sm font-normal outline-none focus:border-[#1582b8]"
            />
          </label>

          {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm font-semibold text-green-700">{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="mt-5 rounded-md bg-[#3997d1] px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#197bb6] disabled:cursor-not-allowed disabled:bg-[#9fb7c6]"
          >
            {isSubmitting ? "Sending..." : "Submit Custom Targets"}
          </button>
        </form>
      </div>
    </section>
  );
}
