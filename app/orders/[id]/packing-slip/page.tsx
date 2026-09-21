"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/env";

export default function PackingSlipPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const signInUrl = `/my-account?next=${encodeURIComponent(`/orders/${id}/packing-slip`)}`;
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");
  const [signInRequired, setSignInRequired] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    async function load() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setSignInRequired(true);
        setError("Sign in with your staff account to view this packing slip.");
        router.replace(signInUrl);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/v1/orders/${encodeURIComponent(id)}/packing-slip/`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal,
        });
        if (response.status === 401) {
          setSignInRequired(true);
          router.replace(signInUrl);
          throw new Error("Your session expired. Sign in to view this packing slip.");
        }
        if (response.status === 403) throw new Error("Only authorized staff can access packing slips.");
        if (response.status === 404) throw new Error("This order could not be found.");
        if (!response.ok) throw new Error("Unable to load the packing slip. Please try again.");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load packing slip.");
      }
    }
    void load();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, router, signInUrl]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Packing slip — ORD-{String(id).padStart(6, "0")}</h1>
        {pdfUrl && <div className="flex gap-4">
          <a href={pdfUrl} download={`packing-slip-ORD-${String(id).padStart(6, "0")}.pdf`} className="rounded bg-blue-900 px-4 py-2 text-white">Download PDF</a>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="rounded border px-4 py-2">Open / print</a>
        </div>}
      </div>
      {error ? <div role="alert" className="rounded border border-slate-200 p-6">
        <p>{error}</p>
        {signInRequired && <a href={signInUrl} className="mt-4 inline-block text-blue-800 underline">Sign in</a>}
      </div> : pdfUrl ? <iframe title="Order packing slip PDF" src={pdfUrl} className="h-[80vh] w-full rounded border" />
        : <p role="status">Preparing packing slip…</p>}
    </main>
  );
}
