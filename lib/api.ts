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
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
