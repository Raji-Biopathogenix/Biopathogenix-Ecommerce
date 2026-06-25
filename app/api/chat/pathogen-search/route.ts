import { NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE = "http://127.0.0.1:8000/api";

function looksLikeHtml(text: string) {
  return /^\s*<!DOCTYPE/i.test(text) || /^\s*<html/i.test(text);
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toCandidates(endpoint: string) {
  const trimmed = endpoint.trim();
  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  const withTrailingSlash = `${withoutTrailingSlash}/`;

  return Array.from(new Set([trimmed, withoutTrailingSlash, withTrailingSlash])).filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendEndpoint =
      process.env.PATHOGEN_LOOKUP_BACKEND_URL ??
      `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BACKEND_BASE).replace(/\/+$/, "")}/pathogen-lookup/`;
    const candidates = toCandidates(backendEndpoint);

    let upstream: Response | null = null;
    let text = "";

    for (const url of candidates) {
      upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      text = await upstream.text();

      if (upstream.status !== 404) break;
    }

    if (!upstream) {
      return NextResponse.json({ error: "Pathogen lookup backend endpoint is not configured." }, { status: 500 });
    }

    const parsed = tryParseJson(text);

    if (!upstream.ok || looksLikeHtml(text)) {
      if (!looksLikeHtml(text) && isPlainObject(parsed)) {
        return NextResponse.json(
          {
            ...parsed,
            status: upstream.status,
            checkedUrls: candidates,
          },
          { status: upstream.status }
        );
      }

      const error =
        upstream.status === 404
          ? "Pathogen lookup backend endpoint not found"
          : looksLikeHtml(text)
            ? "Backend returned HTML instead of JSON"
            : "Backend request failed";

      return NextResponse.json(
        {
          error,
          status: upstream.status,
          checkedUrls: candidates,
          bodyPreview: text.slice(0, 200),
        },
        { status: 502 }
      );
    }

    if (parsed === null) {
      return NextResponse.json(
        {
          error: "Backend returned invalid JSON",
          status: upstream.status,
          checkedUrls: candidates,
          bodyPreview: text.slice(0, 200),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Pathogen lookup backend not connected", detail },
      { status: 500 }
    );
  }
}
