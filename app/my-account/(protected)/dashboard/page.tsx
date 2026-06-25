"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UserProfile = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("user_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        setProfile(null);
      }
    }
  }, []);

  const displayName = useMemo(() => {
    const first = profile?.first_name?.trim() || "";
    const last = profile?.last_name?.trim() || "";
    const full = `${first} ${last}`.trim();
    return full || profile?.email || "there";
  }, [profile]);

  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-[#0B3C5D]">

      <p>
        Hello{" "}
        <strong>{displayName}</strong>{" "}
        (not {displayName}?{" "}
        <Link
          href="/logout"
          className="text-[#1E73BE] hover:underline"
        >
          Log out
        </Link>
        )
      </p>

      {profile?.email && (
        <p>
          Email: <strong>{profile.email}</strong>
        </p>
      )}

      <p>
        From your account dashboard you can view your{" "}
        <Link
          href="/my-account/orders"
          className="text-[#1E73BE] hover:underline"
        >
          recent orders
        </Link>
        , manage your{" "}
        <Link
          href="/my-account/edit-address"
          className="text-[#1E73BE] hover:underline"
        >
          shipping and billing addresses
        </Link>
        , and edit your{" "}
        <Link
          href="/my-account/edit-account"
          className="text-[#1E73BE] hover:underline"
        >
          password and account details
        </Link>
        .
      </p>

    </div>
  );
}
