"use client";

import { useEffect, useRef } from "react";

type Protection = {
  initialize: (form: HTMLFormElement) => void;
  fields: (form: HTMLFormElement) => Promise<Record<string, string>>;
};

declare global {
  interface Window { BPXFormProtection?: Protection }
}

let ready: Promise<Protection> | undefined;
function loadProtection(): Promise<Protection> {
  if (window.BPXFormProtection) return Promise.resolve(window.BPXFormProtection);
  if (!ready) {
    ready = new Promise<Protection>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/form-protection.js";
      script.onload = () => {
        if (window.BPXFormProtection) resolve(window.BPXFormProtection);
        else reject(new Error("Unable to load spam protection. Please try again."));
      };
      script.onerror = () => {
        script.remove();
        ready = undefined;
        reject(new Error("Unable to load spam protection. Please try again."));
      };
      document.head.appendChild(script);
    });
  }
  return ready;
}

export async function getFormProtection(form: HTMLFormElement) {
  return (await loadProtection()).fields(form);
}

export default function FormProtection() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (form) void loadProtection().then((protection) => {
      if (form.isConnected) protection.initialize(form);
    }).catch(() => { /* The submit handler displays loading failures. */ });
  }, []);
  return <span ref={anchor} hidden />;
}
