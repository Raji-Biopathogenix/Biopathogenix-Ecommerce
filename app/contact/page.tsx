"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "@/config/env";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export default function ContactSection() {
  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.first_name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("First Name, Email, and Message are required.");
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
      setForm({ first_name: "", last_name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid lg:grid-cols-2 gap-16 items-start">

        {/* ================= FORM ================= */}
        <div>
          <h1 className="text-5xl font-semibold text-[#003B5C] mb-10">
            Contact Us
          </h1>

          {success ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-green-800">
              <p className="text-lg font-semibold mb-1">Message sent!</p>
              <p className="text-sm">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
              <button
                className="mt-4 text-sm text-green-700 underline"
                onClick={() => setSuccess(false)}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>

              {/* Row 1 */}
              <div className="grid md:grid-cols-2 gap-6">
                <Field label="First Name" name="first_name" required value={form.first_name} onChange={handleChange} />
                <Field label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} />
              </div>

              {/* Row 2 */}
              <div className="grid md:grid-cols-2 gap-6">
                <Field label="Email" name="email" required type="email" value={form.email} onChange={handleChange} />
                <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} />
              </div>

              {/* Subject */}
              <Field label="Subject" name="subject" value={form.subject} onChange={handleChange} />

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-[#003B5C] mb-2">
                  Message <span className="text-blue-600">*</span>
                </label>
                <textarea
                  name="message"
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-200 bg-[#f4f9fc] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-[#0b84d8] hover:bg-[#086fb6] disabled:opacity-60 text-white px-6 py-3 rounded-md font-medium transition"
              >
                {loading ? "Sending..." : "Send Message"} <ArrowRight size={18} />
              </button>

            </form>
          )}
        </div>

        {/* ================= INFO CARD ================= */}
        <div className="relative rounded-2xl overflow-hidden">

          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0b5fa5] via-[#0b84d8] to-[#6fb7e9]" />

          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Content */}
          <div className="relative p-10 text-white">
            <h2 className="text-3xl font-semibold mb-10">Our Information</h2>

            <InfoRow icon={<Mail size={22} />} label="Email" value="order@biopathogenix.com" />
            <InfoRow icon={<Phone size={22} />} label="Phone" value="(859) 444-5660" />
            <InfoRow icon={<MapPin size={22} />} label="Location" value={`120 Dewey Drive STE 126,\nNicholasville, KY 40356`} />
            <InfoRow icon={<Clock size={22} />} label="Hours" value={`Monday - Friday: 9am–5pm\nSaturday: Closed\nSunday: Closed`} />
          </div>
        </div>

      </div>
    </section>
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
      <label className="block text-sm font-medium text-[#003B5C] mb-2">
        {label} {required && <span className="text-blue-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-md border border-gray-200 bg-[#f4f9fc] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-4 mb-8">
      <div className="mt-1 text-white/90">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-white/70 mb-1">{label}</p>
        <p className="whitespace-pre-line font-medium leading-relaxed">{value}</p>
      </div>
    </div>
  );
}
