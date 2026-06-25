import type { ChatMessage } from "@/store/chatStore";

export type ChatIntakeFormIntent = {
  assayType: "custom" | "standard" | "customer_support" | "validation_service" | "sales_quote";
  title: string;
  subtitle: string;
  confirmation: string;
};

export type ChatResponse = {
  reply: string;
  intakeForm?: ChatIntakeFormIntent | null;
};

export type PathogenMatch = {
  pathogenTarget: string;
  panelCount: number;
  panels: string[];
};

export type PathogenSearchResponse = {
  matched: boolean;
  query?: string;
  matches: PathogenMatch[];
};

function buildErrorMessage(parts: Array<string | undefined>) {
  const uniqueParts: string[] = [];

  for (const part of parts) {
    const normalized = part?.trim();
    if (!normalized || uniqueParts.includes(normalized)) {
      continue;
    }
    uniqueParts.push(normalized);
  }

  return uniqueParts.join(" ");
}

export async function sendChatMessage({
  userText,
  history,
}: {
  userText: string;
  history: ChatMessage[];
}): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userText, history }),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const payload = (await res.json()) as {
        error?: string;
        detail?: string;
        message?: string;
        reply?: string;
        status?: number;
      };

      const message =
        buildErrorMessage([payload.reply, payload.message, payload.error, payload.detail]) ||
        (payload.status ? `Chat request failed (${payload.status})` : "Chat request failed");

      throw new Error(message);
    }

    const txt = (await res.text()).trim();
    throw new Error(txt || `Chat request failed (${res.status})`);
  }

  return (await res.json()) as ChatResponse;
}

export async function searchPathogenAssays(query: string): Promise<PathogenSearchResponse> {
  const res = await fetch("/api/chat/pathogen-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const payload = (await res.json()) as {
        error?: string;
        detail?: string;
        message?: string;
      };

      const message =
        buildErrorMessage([payload.message, payload.error, payload.detail]) || "Pathogen search failed";

      throw new Error(message);
    }

    const txt = (await res.text()).trim();
    throw new Error(txt || `Pathogen search failed (${res.status})`);
  }

  return (await res.json()) as PathogenSearchResponse;
}
