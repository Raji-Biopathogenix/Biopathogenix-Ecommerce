"use client";

import { useEffect, useState } from "react";
import HeaderSection from "./Header";
import { API_BASE_URL } from "@/config/env";
import { HeaderMenus } from "@/types/header";

const EMPTY_HEADER_MENUS: HeaderMenus = {
  status: "error",
  message: "Menu service unavailable",
  result: {
    data: [],
    search_categories: [],
    top_searchs: [],
  },
};

const HEADER_FETCH_TIMEOUT_MS = 8000;

export default function HeaderWrapper() {
  const [menuRes, setMenuRes] = useState<HeaderMenus>(EMPTY_HEADER_MENUS);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HEADER_FETCH_TIMEOUT_MS);

    fetch(`${API_BASE_URL}/v1/headermenu`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          return EMPTY_HEADER_MENUS;
        }
        return (await res.json()) as HeaderMenus;
      })
      .then((payload) => {
        setMenuRes(payload);
      })
      .catch(() => {
        setMenuRes(EMPTY_HEADER_MENUS);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <HeaderSection
      menus={menuRes?.result?.data ?? []}
      search_categories={menuRes?.result?.search_categories ?? []}
      top_searchs={menuRes?.result?.top_searchs ?? []}
    />
  );
}
