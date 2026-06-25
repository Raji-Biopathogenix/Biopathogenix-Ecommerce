"use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    document.cookie = "access_token=; path=/; max-age=0";
    localStorage.removeItem("access_token");
    window.location.href = "/my-account";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Signing out...</p>
    </div>
  );
}
