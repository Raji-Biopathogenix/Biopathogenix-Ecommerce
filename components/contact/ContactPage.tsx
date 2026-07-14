"use client";

import { useState } from "react";
import { ArrowRight, Clock3, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { API_BASE_URL } from "@/config/env";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const emptyForm: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const contactStats = [
  {
    label: "Email",
    value: "order@biopathogenix.com",
    href: "mailto:order@biopathogenix.com",
    icon: Mail,
  },
  {
    label: "Phone",
    value: "(859) 444-5660",
    href: "tel:(859)444-5660",
    icon: Phone,
  },
  {
    label: "Location",
    value: "3004 Park Central Ave, Nicholasville, KY 40356",
    href: "https://maps.app.goo.gl/Uz7FhqXWEMZWCSkK6",
    icon: MapPin,
  },
];

const officeHours = [
  { day: "Monday - Friday", hours: "9:00 AM - 5:00 PM" },
  { day: "Saturday", hours: "Closed" },
  { day: "Sunday", hours: "Closed" },
];

export default function ContactPage({ eyebrow = "Contact" }: { eyebrow?: string }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.first_name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("First name, email, and message are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/contact-form/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send message.");
      }

      setSuccess(true);
      setForm(emptyForm);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-[#f5f8fc] text-[#0b2e59]">
      <section className="relative overflow-hidden border-b border-[#dce7f2] bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)]">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(11,118,209,0.14), transparent 28%), radial-gradient(circle at 80% 0%, rgba(0,59,92,0.08), transparent 24%), radial-gradient(circle at 100% 100%, rgba(11,118,209,0.10), transparent 30%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#4f78a8]">
            {eyebrow}
          </p>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight text-[#0b2e59] md:text-5xl">
              Contact BioPathogenix
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Send us your question, request, or quote details and our team will
              route it directly to <span className="font-semibold text-[#0b2e59]">order@biopathogenix.com</span>.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#d9e5f0] bg-white p-8 shadow-[0_18px_45px_rgba(18,51,82,0.08)]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e8f2fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0b5fa5]">
                <Sparkles size={14} />
                Direct contact
              </div>
              <h2 className="text-2xl font-semibold text-[#0b2e59]">We keep the next step simple</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use the form to send us a message. Once submitted, the fields clear
                automatically so you can start fresh on the next request.
              </p>

              <div className="mt-8 grid gap-4">
                {contactStats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.label === "Location" ? "_blank" : undefined}
                      rel={item.label === "Location" ? "noreferrer" : undefined}
                      className="group flex items-start gap-4 rounded-2xl border border-[#e4edf5] bg-[#f9fbfe] p-4 transition hover:border-[#b8d4ef] hover:bg-white"
                    >
                      <span className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b5fa5] text-white shadow-sm">
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#6d87a7]">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-sm font-medium leading-6 text-[#0b2e59] transition group-hover:text-[#0b5fa5]">
                          {item.value}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[#d9e5f0] bg-[#0b2e59] p-8 text-white shadow-[0_18px_45px_rgba(18,51,82,0.12)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <Clock3 size={18} />
                </span>
                <h3 className="text-xl font-semibold">Office hours</h3>
              </div>
              <div className="mt-6 space-y-4">
                {officeHours.map((item) => (
                  <div
                    key={item.day}
                    className="flex items-center justify-between border-b border-white/10 pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <span className="text-white/80">{item.day}</span>
                    <span className="font-medium">{item.hours}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-white/80">
                If you prefer, you can also email us directly at{" "}
                <a className="font-semibold text-white underline decoration-white/40 underline-offset-4" href="mailto:order@biopathogenix.com">
                  order@biopathogenix.com
                </a>
                .
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#d9e5f0] bg-white p-6 shadow-[0_18px_45px_rgba(18,51,82,0.08)] md:p-8">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#4f78a8]">
                Send a message
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-[#0b2e59]">
                Contact form
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Tell us what you need and include any order or product details that
                will help us respond quickly.
              </p>
            </div>

            {success ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
                <p className="text-lg font-semibold">Message sent</p>
                <p className="mt-1 text-sm leading-6">
                  Your request was sent to order@biopathogenix.com. The form has
                  been cleared for your next message.
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="mt-4 text-sm font-medium text-green-800 underline underline-offset-4"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="First name"
                    name="first_name"
                    required
                    value={form.first_name}
                    onChange={handleChange}
                  />
                  <Field
                    label="Last name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Email"
                    name="email"
                    required
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                  <Field
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <Field
                  label="Subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0b2e59]">
                    Message <span className="text-[#0b5fa5]">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows={7}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className="w-full rounded-2xl border border-[#d6e1ec] bg-[#f8fbff] px-4 py-3 text-sm text-[#0b2e59] outline-none transition placeholder:text-slate-400 focus:border-[#7fb3df] focus:ring-4 focus:ring-[#b9d8f2]/50"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b5fa5] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#094f88] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Send message"}
                    <ArrowRight size={16} />
                  </button>
                  <p className="text-xs leading-5 text-slate-500">
                    Submissions are emailed to the order team and the form resets
                    after a successful send.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#0b2e59]">
        {label} {required && <span className="text-[#0b5fa5]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-[#d6e1ec] bg-[#f8fbff] px-4 py-3 text-sm text-[#0b2e59] outline-none transition placeholder:text-slate-400 focus:border-[#7fb3df] focus:ring-4 focus:ring-[#b9d8f2]/50"
      />
    </div>
  );
}
