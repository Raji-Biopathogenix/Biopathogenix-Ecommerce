import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/config/env";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/form-protection-config/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Protection configuration unavailable");
    const data = await response.json();
    return NextResponse.json({ site_key: data.site_key, api_base_url: API_BASE_URL });
  } catch {
    return NextResponse.json({ message: "Unable to load spam protection. Please try again." }, { status: 503 });
  }
}
