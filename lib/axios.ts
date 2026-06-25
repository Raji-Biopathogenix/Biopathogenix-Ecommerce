"use client"

import axios from "axios";
import { API_BASE_URL } from "@/config/env";

const parsePayloadMessage = (payload: unknown): string | undefined => {
    if (!payload || typeof payload !== "object") return undefined;

    const data = payload as {
        error?: string;
        err?: string;
        message?: string;
        errors?: Record<string, unknown> | string;
    };

    if (data.error) return data.error;
    if (data.err) return data.err;
    if (data.message) return data.message;

    if (data.errors) {
        if (typeof data.errors === "string") return data.errors;
        if (typeof data.errors === "object") {
            const firstKey = Object.keys(data.errors)[0];
            const firstValue = data.errors[firstKey];
            if (Array.isArray(firstValue)) return String(firstValue[0]);
            if (typeof firstValue === "string") return firstValue;
        }
    }

    return undefined;
};

const AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
    // withCredentials: true,
});

AxiosInstance.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("access_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

AxiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status ?? 0;
        const data = error?.response?.data;
        const payloadMessage = parsePayloadMessage(data);

        const normalized = {
            message:
                payloadMessage ||
                error?.message ||
                (status === 0 ? "Unable to reach API server." : "Something went wrong."),
            status,
            retry: typeof data?.retry === "boolean" ? data.retry : status === 0 || status >= 500,
            transaction_id: data?.transaction_id ?? null,
            payload: data ?? null,
        };

        if (status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("access_token");
                window.location.href = "/my-account";
            }
        }

        return Promise.reject(normalized);
    }
);

export default AxiosInstance;
