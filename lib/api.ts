import { API_BASE_URL } from "@/config/env";

type FetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function fetchJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const { body, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(url, {
    ...rest,
    headers: isFormData
      ? headers
      : {
          "Content-Type": "application/json",
          ...(headers || {}),
        },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.clone().json();
      if (data && typeof data === "object") {
        message = data.error || data.message || data.detail || message;
      }
    } catch {
      // response body wasn't JSON; keep the generic status message
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
