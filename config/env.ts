const envApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

const defaultApiBaseUrl =
	process.env.NODE_ENV === "development"
		? "http://127.0.0.1:8000/api"
		: "https://bio.biopathogenix.com/api";

export const API_BASE_URL =
	envApiBaseUrl && envApiBaseUrl.length > 0 ? envApiBaseUrl : defaultApiBaseUrl;
