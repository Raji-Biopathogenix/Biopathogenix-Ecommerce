"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import {
  searchPathogenAssays,
  sendChatMessage,
  type ChatIntakeFormIntent,
  type PathogenMatch,
} from "@/lib/chatApi";
import { QUICK_OPTIONS, type QuickOption } from "@/lib/chatQuickOptions";
import { ASSAY_PANEL_LINKS, type AssayTypeConfig } from "@/lib/assays";
import { createRandomId } from "@/lib/randomId";
import AssayIntakeForm from "@/components/chat/AssayIntakeForm";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type AssayFlowStep =
  | null
  | "ask_assay_type"
  | "pathogen_search"
  | "panel_browse"
  | "standard_refine"
  | "standard_opened"
  | "custom_followup";

type ProductLookupResponse = {
  matched?: boolean;
  targetType?: "product" | "document" | "category" | "subcategory";
  href?: string;
  product?: {
    id?: number | null;
    name?: string | null;
    slug?: string | null;
  };
  document?: {
    id?: number | null;
    title?: string | null;
    section?: string | null;
  };
  category?: {
    name?: string | null;
    slug?: string | null;
  };
  subCategory?: {
    name?: string | null;
    slug?: string | null;
  } | null;
};

type AssayFormState = {
  assayType: "custom" | "standard" | "customer_support" | "validation_service" | "sales_quote";
  title: string;
  subtitle: string;
  initialReason?: string;
  returnStep?: Exclude<AssayFlowStep, null>;
};

export default function ChatWidget() {
  const router = useRouter();

  const {
    isOpen,
    toggle,
    close,
    width,
    height,
    preset,
    setPreset,
    messages,
    input,
    setInput,
    addMessage,
    isSending,
    setSending,
  } = useChatStore();

  const [showQuickPopup, setShowQuickPopup] = useState(true);
  const [flowStep, setFlowStep] = useState<AssayFlowStep>(null);
  const [assayForm, setAssayForm] = useState<AssayFormState | null>(null);
  const [showInChatQuickOptions, setShowInChatQuickOptions] = useState(false);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [lastClickedOptionLabel, setLastClickedOptionLabel] = useState<string>("General");

  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages.length, flowStep, assayForm]);

  function renderMessage(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+|\/[^\s]+)/g;

    return text.split(urlRegex).map((part, i) => {
      const isUrl = /^(https?:\/\/|\/)/.test(part);

      if (!isUrl) return <span key={i}>{part}</span>;

      return (
        <a
          key={i}
          href={part}
          className="text-blue-600 underline break-words text-left hover:text-blue-800"
        >
          {part}
        </a>
      );
    });
  }

  function buildPathogenResultsMessage(query: string, matches: PathogenMatch[]) {
    const quotedQuery = `"${query}"`;

    if (matches.length === 1) {
      const [match] = matches;
      const panelLabel = match.panelCount === 1 ? "panel" : "panels";

      return [
        `I found 1 match for ${quotedQuery}.`,
        "",
        `${match.pathogenTarget} is included in ${match.panelCount} ${panelLabel}:`,
        match.panels.join(", "),
        "",
        "Type another pathogen name below to keep searching.",
      ].join("\n");
    }

    const lines = [`I found ${matches.length} matches for ${quotedQuery}.`, ""];

    matches.forEach((match, index) => {
      const panelLabel = match.panelCount === 1 ? "panel" : "panels";
      lines.push(`${index + 1}. ${match.pathogenTarget}`);
      lines.push(`Included in ${match.panelCount} ${panelLabel}: ${match.panels.join(", ")}`);
      lines.push("");
    });

    lines.push("Type another pathogen name below to keep searching.");
    return lines.join("\n");
  }

  function cancelPathogenSearch() {
    addMessage({
      id: createRandomId(),
      role: "assistant",
      content: "Pathogen search canceled. What would you like to do next?",
      createdAt: Date.now(),
    });
    setInput("");
    setFlowStep(null);
    setShowInChatQuickOptions(true);
  }

  function handleQuickOptionClick(opt: QuickOption) {
    if (!isOpen) toggle();
    setShowQuickPopup(false);
    setShowInChatQuickOptions(false);
    const isPcrReagentsOption = opt.key === "qplex-pcr-assays";

    addMessage({
      id: createRandomId(),
      role: "user",
      content: opt.label,
      createdAt: Date.now(),
    });

    if (isPcrReagentsOption) {
      addMessage({
        id: createRandomId(),
        role: "assistant",
        content: "Please choose one option below.",
        createdAt: Date.now(),
      });
      setFlowStep("ask_assay_type");
      return;
    }

    setLastClickedOptionLabel(opt.label.trim());
    router.push(opt.href);
    addMessage({
      id: createRandomId(),
      role: "assistant",
      content: "I have opened the page you requested.",
      createdAt: Date.now(),
    });
    setFlowStep("standard_opened");
  }

  function looksLikeGreeting(text: string) {
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
    return /^(hi|hii+|hello|hey|good morning|good afternoon|good evening)$/.test(normalized);
  }

  function looksLikeProductRequest(text: string) {
    if (looksLikeGreeting(text)) return false;

    return /(looking\s+for|search(?:ing)?\s+for|show\s+me|find|open|go\s+to|navigate|product|products|kit|kits|assay|assays|reagent|reagents|document|documents|doc|docs|pdf|sds|ifu|manual|certificate|coa|category|categories|sub category|subcategory|tab|tabs|shop|catalog|catalogue|pcr|qpcr|qplex|extraction|quality control|ppe|new arrivals|sku)/i.test(text);
  }

  function looksLikeSupportRequest(text: string) {
    return /(quote|quotes|quotation|bulk(?:\s+price|\s+pricing)?|bulck(?:\s+price|\s+pricing)?|volume\s+pricing|customer\s+support|customer\s+service|support|service|contact\s*form|sales\s+team|assay\s+team|extraction\s+team|talk(?:\s+direct(?:ly)?)?\s+to\s+(?:a\s+)?(?:person|human|agent|representative)|human\s+(?:agent|support)|need\s+assistance|direct\s+person|sales|pricing)/i.test(text);
  }

  function looksLikeCustomerSupport(text: string) {
    return /(customer\s+support|customer\s+service|technical\s+support|tech\s+support|i\s+have\s+an?\s+issue|i\s+have\s+a\s+problem|not\s+working|help\s+me|trouble|complaint|report\s+(?:an?\s+)?issue)/i.test(text);
  }

  function looksLikeValidationService(text: string) {
    return /(validation\s+service|biobank\s+validation|kit\s+validation|assay\s+validation\s+service|validation\s+request|request\s+validation)/i.test(text);
  }

  function looksLikeSalesQuote(text: string) {
    return /(quote|quotes|quotation|get\s+a\s+price|pricing\s+request|bulk\s+order|bulk\s+price|volume\s+pricing|sales\s+inquiry|sales\s+request|place\s+an?\s+order|request\s+(?:a\s+)?quote|need\s+(?:a\s+)?quote)/i.test(text);
  }

  function openIntakeForm(intent: ChatIntakeFormIntent, initialReason: string) {
    setAssayForm({
      assayType: intent.assayType,
      title: intent.title,
      subtitle: intent.subtitle,
      initialReason,
    });
    setFlowStep(null);
  }

  function openAssayPanel(panel: AssayTypeConfig) {
    router.push(`/assays/${panel.routeSlug}`);
    addMessage({
      id: createRandomId(),
      role: "assistant",
      content: `I have opened the ${panel.label} panel page.`,
      createdAt: Date.now(),
    });
    setFlowStep("standard_opened");
  }

  async function lookupProductRoute(text: string) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch("/api/chat/product-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
        signal: controller.signal,
      });

      if (!res.ok) return null;
      return (await res.json()) as ProductLookupResponse;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function onSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg = {
      id: createRandomId(),
      role: "user" as const,
      content: text,
      createdAt: Date.now(),
    };

    addMessage(userMsg);
    setInput("");
    setShowInChatQuickOptions(false);

    setSending(true);
    try {
      if (flowStep === "pathogen_search") {
        const { matches } = await searchPathogenAssays(text);

        addMessage({
          id: createRandomId(),
          role: "assistant",
          content:
            matches.length > 0
              ? buildPathogenResultsMessage(text, matches)
              : `I could not find any matching assays for ${text}. Try another pathogen name or click I need assistance.`,
          createdAt: Date.now(),
        });
        return;
      }

      if (looksLikeGreeting(text)) {
        addMessage({
          id: createRandomId(),
          role: "assistant",
          content: "Hi! How can I help you today?",
          createdAt: Date.now(),
        });
        return;
      }

      if (looksLikeSalesQuote(text)) {
        addMessage({
          id: createRandomId(),
          role: "assistant",
          content: "I'll connect you with our sales team. Please fill in your details below and we'll get back to you with pricing.",
          createdAt: Date.now(),
        });
        setAssayForm({
          assayType: "sales_quote",
          title: "Sales & Quotes Request",
          subtitle: "Share your details and our sales team will contact you within 24 hours.",
          initialReason: text,
        });
        return;
      }

      if (looksLikeCustomerSupport(text)) {
        addMessage({
          id: createRandomId(),
          role: "assistant",
          content: "I'll connect you with our support team. Please fill in your details below.",
          createdAt: Date.now(),
        });
        setAssayForm({
          assayType: "customer_support",
          title: "Customer Support Request",
          subtitle: "Share your details and our support team will contact you within 24 hours.",
          initialReason: text,
        });
        return;
      }

      if (looksLikeValidationService(text)) {
        addMessage({
          id: createRandomId(),
          role: "assistant",
          content: "I'll connect you with our validation services team. Please fill in your details below.",
          createdAt: Date.now(),
        });
        setAssayForm({
          assayType: "validation_service",
          title: "Validation Service Request",
          subtitle: "Share your details and our team will contact you within 24 hours.",
          initialReason: text,
        });
        return;
      }

      if (!looksLikeSupportRequest(text) && looksLikeProductRequest(text)) {
        const lookup = await lookupProductRoute(text);
        if (lookup?.matched && lookup.href) {
          if (lookup.href.startsWith("/")) {
            router.push(lookup.href);
          } else {
            window.location.href = lookup.href;
          }
          addMessage({
            id: createRandomId(),
            role: "assistant",
            content: lookup.targetType === "document"
              ? "I have opened the product document you requested."
              : lookup.targetType === "product"
              ? "I have opened the product page you requested."
              : lookup.targetType === "subcategory"
              ? "I have opened the sub-category page you requested."
              : "I have opened the category page you requested.",
            createdAt: Date.now(),
          });
          setFlowStep("standard_opened");
          return;
        }
      }

      const { reply, intakeForm } = await sendChatMessage({
        userText: text,
        history: messages,
      });

      if (reply) {
        addMessage({
          id: createRandomId(),
          role: "assistant",
          content: reply,
          createdAt: Date.now(),
        });
      }

      if (intakeForm) {
        openIntakeForm(intakeForm, text);
      }
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "";
      addMessage({
        id: createRandomId(),
        role: "assistant",
        content: detail || "Sorry - the chat request failed.",
        createdAt: Date.now(),
      });
    } finally {
      setSending(false);
    }
  }

  const isMobile = viewport.width < 640;
  const edgeOffset = isMobile ? 8 : 24;
  const maxWidth = Math.max(280, viewport.width - edgeOffset * 2);
  const maxHeight = Math.max(360, viewport.height - edgeOffset * 2);
  const minWidth = Math.min(280, maxWidth);
  const minHeight = Math.min(360, maxHeight);
  const panelWidth = clamp(width, minWidth, maxWidth);
  const panelHeight = clamp(height, minHeight, maxHeight);

  const panelStyle = useMemo(
    () =>
      ({
        width: `${panelWidth}px`,
        height: `${panelHeight}px`,
        right: `${edgeOffset}px`,
        bottom: `${edgeOffset}px`,
      }) as React.CSSProperties,
    [edgeOffset, panelHeight, panelWidth]
  );

  const launcherStyle = useMemo(
    () =>
      ({
        right: `${edgeOffset}px`,
        bottom: `${edgeOffset}px`,
      }) as React.CSSProperties,
    [edgeOffset]
  );

  return (
    <>
      {!isOpen && (
        <div className="fixed z-[9999] flex flex-col items-end gap-2 print:hidden" style={launcherStyle}>
          {showQuickPopup && (
            <div className="w-[300px] max-w-[calc(100vw-16px)] rounded-2xl border border-[#d5e3f2] bg-white p-3 shadow-xl">
              <div className="text-sm font-medium mb-2">What are you looking for?</div>

              <div className="space-y-2">
                {QUICK_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    className="w-full text-left rounded-xl border border-[#d5e3f2] px-3 py-2 text-sm text-[#21364b] hover:bg-[#eef5fc]"
                    onClick={() => handleQuickOptionClick(opt)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setShowQuickPopup(false)}
              >
                Dismiss
              </button>
            </div>
          )}

          <button
            onClick={() => {
              toggle();
              setShowQuickPopup(false);
            }}
            aria-label="Chat with BioPath"
            className={
              isMobile
                ? "flex h-14 w-14 items-center justify-center rounded-full border border-[#d5e3f2] bg-[linear-gradient(120deg,#0b2e4f_0%,#1b4c79_100%)] text-white shadow-[0_14px_30px_rgba(11,46,79,0.35)] transition hover:translate-y-[-1px]"
                : "rounded-full border border-[#d5e3f2] bg-[linear-gradient(120deg,#0b2e4f_0%,#1b4c79_100%)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_40px_rgba(11,46,79,0.35)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_44px_rgba(11,46,79,0.35)]"
            }
          >
            {isMobile ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            ) : (
              "Chat With BioPath"
            )}
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed z-[9999] overflow-hidden rounded-2xl border border-[#d5e3f2] bg-white shadow-2xl print:hidden"
          style={panelStyle}
        >
          <div className="flex select-none items-center justify-between gap-2 bg-[linear-gradient(120deg,#0b2e4f_0%,#1b4c79_100%)] px-3 py-3 text-white sm:px-4">
            <div className="font-semibold text-sm">Chat with BioPath</div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {(["sm", "md", "lg", "xl"] as const).map((p) => (
                  <button
                    key={p}
                    className={`px-2 sm:px-3 py-2 text-[10px] sm:text-xs rounded-md border border-white/30 hover:bg-white/10 ${
                      preset === p ? "bg-white/15" : ""
                    }`}
                    onClick={() => setPreset(p)}
                    title={`Set size: ${p}`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                className="px-2 py-1 text-xs rounded-md border border-white/30 hover:bg-white/10"
                onClick={() => {
                  close();
                  setShowQuickPopup(true);
                  setFlowStep(null);
                }}
                aria-label="Close chat"
              >
                x
              </button>
            </div>
          </div>

          <div className="flex flex-col h-[calc(100%-52px)]">
            <div ref={messagesRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-sm text-gray-500">Hi! How can I help you today?</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "ml-auto bg-[#0b2e4f] text-white whitespace-pre-line"
                        : "mr-auto border border-[#d5e3f2] bg-[#f4f9ff] text-[#21364b] whitespace-pre-line"
                    }`}
                  >
                    {renderMessage(m.content)}
                  </div>
                ))
              )}

              {flowStep === "ask_assay_type" && (
                <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl bg-gray-100 p-3">
                  <div className="text-sm mb-2">
                    Are you looking for Standard Assay Kits or Custom Assays?
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="rounded-xl bg-[#0b2e4f] px-3 py-2 text-sm text-white hover:bg-[#11406b]"
                      onClick={() => {
                        router.push("/product/qplex-pcr-assays");
                        addMessage({
                          id: createRandomId(),
                          role: "assistant",
                          content: "I have opened the Standard Assays page for you.",
                          createdAt: Date.now(),
                        });
                        setFlowStep("standard_refine");
                      }}
                    >
                      Standard Assays
                    </button>

                    <button
                      className="rounded-xl bg-[#e7f1fb] px-3 py-2 text-sm text-[#0b2e4f] hover:bg-[#d9e9f8]"
                      onClick={() => {
                        router.push("/services/assay-development");
                        addMessage({
                          id: createRandomId(),
                          role: "assistant",
                          content:
                            "I have opened the Custom Assay Development page. If you still need help, click I need assistance below.",
                          createdAt: Date.now(),
                        });
                        setFlowStep("custom_followup");
                      }}
                    >
                      Custom Assays
                    </button>
                  </div>
                </div>
              )}

              {flowStep === "standard_refine" && (
                <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl bg-gray-100 p-3">
                  <div className="text-sm mb-2">Would you like to refine your search?</div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="rounded-xl bg-[#0b2e4f] px-3 py-2 text-sm text-white hover:bg-[#11406b]"
                      onClick={() => {
                        addMessage({
                          id: createRandomId(),
                          role: "assistant",
                          content: "Please choose a panel below.",
                          createdAt: Date.now(),
                        });
                        setFlowStep("panel_browse");
                      }}
                    >
                      Browse by Category
                    </button>

                    <button
                      className="rounded-xl bg-[#e7f1fb] px-3 py-2 text-sm text-[#0b2e4f] hover:bg-[#d9e9f8]"
                      onClick={() => {
                        addMessage({
                          id: createRandomId(),
                          role: "assistant",
                          content: "Type pathogen in the search bar below and I will show the matching assays.",
                          createdAt: Date.now(),
                        });
                        setFlowStep("pathogen_search");
                      }}
                    >
                      Search by Pathogen
                    </button>
                  </div>
                </div>
              )}

              {flowStep === "panel_browse" && (
                <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl bg-gray-100 p-3">
                  <div className="text-sm mb-2">Select a panel to open:</div>
                  <div className="flex gap-2 flex-wrap">
                    {ASSAY_PANEL_LINKS.map((panel) => (
                      <button
                        key={panel.routeSlug}
                        className="rounded-xl border border-[#d5e3f2] bg-white px-3 py-2 text-sm font-semibold text-[#0b2e4f] hover:bg-[#eef5fc]"
                        onClick={() => openAssayPanel(panel)}
                      >
                        {panel.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {flowStep === "pathogen_search" && (
                <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl bg-gray-100 p-3">
                  <div className="text-sm mb-2">Pathogen search is active. Type pathogen in the search bar below.</div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="rounded-xl bg-[#0b2e4f] px-3 py-2 text-sm text-white hover:bg-[#11406b]"
                      onClick={() => setFlowStep("standard_refine")}
                    >
                      Back
                    </button>

                    <button
                      className="rounded-xl border border-[#d5e3f2] bg-white px-3 py-2 text-sm text-[#21364b] hover:bg-[#eef5fc]"
                      onClick={cancelPathogenSearch}
                    >
                      Cancel Search
                    </button>

                    <button
                      className="rounded-xl bg-[#e7f1fb] px-3 py-2 text-sm text-[#0b2e4f] hover:bg-[#d9e9f8]"
                      onClick={() => {
                        addMessage({
                          id: createRandomId(),
                          role: "assistant",
                          content: "I will gather a few details so our team can follow up efficiently.",
                          createdAt: Date.now(),
                        });
                        setAssayForm({
                          assayType: "standard",
                          title: "Standard Assay Support Request",
                          subtitle: "Share your details and our team will contact you within 24 hours.",
                          initialReason: "Need assistance with pathogen assay selection.",
                          returnStep: "pathogen_search",
                        });
                        setFlowStep(null);
                      }}
                    >
                      I need assistance
                    </button>
                  </div>
                </div>
              )}

              {flowStep === "standard_opened" && (
                <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl bg-gray-100 p-3">
                  <div className="text-sm mb-2">Did you find what you needed?</div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="rounded-xl bg-[#0b2e4f] px-3 py-2 text-sm text-white hover:bg-[#11406b]"
                      onClick={() => {
                        addMessage({
                          id: createRandomId(),
                          role: "assistant",
                          content: "Great! Please choose what you would like to do next.",
                          createdAt: Date.now(),
                        });
                        setShowInChatQuickOptions(true);
                        setFlowStep(null);
                      }}
                    >
                      Yes
                    </button>

                    <button
                      className="rounded-xl bg-[#e7f1fb] px-3 py-2 text-sm text-[#0b2e4f] hover:bg-[#d9e9f8]"
                      onClick={() => {
                        addMessage({
                          id: createRandomId(),
                          role: "assistant",
                          content: "I will gather a few details so our team can follow up efficiently.",
                          createdAt: Date.now(),
                        });
                        setAssayForm({
                          assayType: "customer_support",
                          title: `${lastClickedOptionLabel} Support Request`,
                          subtitle: "Share your details and our team will contact you within 24 hours.",
                          initialReason: `Need assistance with ${lastClickedOptionLabel}.`,
                          returnStep: "standard_opened",
                        });
                        setFlowStep(null);
                      }}
                    >
                      I need assistance
                    </button>
                  </div>
                </div>
              )}

              {flowStep === "custom_followup" && (
                <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl bg-gray-100 p-3">
                  <div className="text-sm mb-2">Did you find what you needed?</div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="rounded-xl bg-[#0b2e4f] px-3 py-2 text-sm text-white hover:bg-[#11406b]"
                      onClick={() => {
                        addMessage({
                          id: createRandomId(),
                          role: "assistant",
                          content: "Great! Please choose what you would like to do next.",
                          createdAt: Date.now(),
                        });
                        setShowInChatQuickOptions(true);
                        setFlowStep(null);
                      }}
                    >
                      Yes
                    </button>

                    <button
                      className="rounded-xl bg-[#e7f1fb] px-3 py-2 text-sm text-[#0b2e4f] hover:bg-[#d9e9f8]"
                      onClick={() => {
                        addMessage({
                          id: createRandomId(),
                          role: "assistant",
                          content: "I will gather a few details so our team can follow up efficiently.",
                          createdAt: Date.now(),
                        });
                        setAssayForm({
                          assayType: "custom",
                          title: "Custom Assay Support Request",
                          subtitle: "Share your details and our team will contact you within 24 hours.",
                          initialReason: "Need assistance with custom assays.",
                          returnStep: "custom_followup",
                        });
                        setFlowStep(null);
                      }}
                    >
                      I need assistance
                    </button>
                  </div>
                </div>
              )}

              {assayForm && (
                <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl bg-gray-100 p-3">
                  <AssayIntakeForm
                    assayType={assayForm.assayType}
                    title={assayForm.title}
                    subtitle={assayForm.subtitle}
                    initialReason={assayForm.initialReason}
                    onCancel={() => {
                      const returnStep = assayForm.returnStep;
                      setAssayForm(null);
                      if (returnStep) {
                        setFlowStep(returnStep);
                      } else {
                        setShowInChatQuickOptions(true);
                      }
                    }}
                    onSuccess={() => {
                      const type = assayForm?.assayType;
                      const contactEmail =
                        type === "sales_quote"
                          ? "order@biopathogenix.com"
                          : type === "validation_service"
                          ? "validation@biopathogenix.com"
                          : "support@biopathogenix.com";
                      setAssayForm(null);
                      addMessage({
                        id: createRandomId(),
                        role: "assistant",
                        content:
                          `Submission received.\n\nOur team will review your request and get back to you within 24 hours.\n\nIf urgent, contact us directly:\n📧 ${contactEmail}\n📞 (859) 605-5866`,
                        createdAt: Date.now(),
                      });
                    }}
                  />
                </div>
              )}

              {showInChatQuickOptions && (
                <div className="mr-auto max-w-[90%] sm:max-w-[85%] rounded-2xl border border-[#d5e3f2] bg-[#f4f9ff] p-3">
                  <div className="mb-2 text-sm text-[#21364b]">What would you like to do next?</div>
                  <div className="space-y-2">
                    {QUICK_OPTIONS.map((opt) => (
                      <button
                        key={`in-chat-${opt.key}`}
                        className="w-full rounded-xl border border-[#d5e3f2] bg-white px-3 py-2 text-left text-sm text-[#21364b] hover:bg-[#eef5fc]"
                        onClick={() => handleQuickOptionClick(opt)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#d5e3f2] bg-white px-3 py-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSend()}
                  className="flex-1 rounded-xl border border-[#d5e3f2] bg-[#f8fbff] px-3 py-2 text-sm outline-none focus:border-[#0b2e4f]"
                  placeholder={flowStep === "pathogen_search" ? "Type pathogen name..." : "Type your message..."}
                />
                <button
                  onClick={onSend}
                  disabled={isSending}
                  className="rounded-2xl bg-[#0b2e4f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#11406b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
