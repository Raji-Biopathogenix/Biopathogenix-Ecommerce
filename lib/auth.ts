export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const fromStorage = window.localStorage.getItem("access_token");
  if (fromStorage) {
    return fromStorage;
  }

  const match = document.cookie.match(/(?:^|; )access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
