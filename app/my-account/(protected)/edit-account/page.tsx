"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/env";

type UserProfile = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export default function EditAccountPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("user_profile");
    if (!stored) return;

    try {
      const profile = JSON.parse(stored) as UserProfile;
      const nextFirst = profile.first_name || "";
      const nextLast = profile.last_name || "";
      const nextDisplay = `${nextFirst} ${nextLast}`.trim();

      setFirstName(nextFirst);
      setLastName(nextLast);
      setDisplayName(nextDisplay || profile.email || "");
      setEmail(profile.email || "");
    } catch {
      // Ignore malformed profile data.
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormMessage(null);
    setFormError(null);

    if (!currentPassword && !newPassword && !confirmPassword) {
      setFormError("Enter your current password and a new password to change it.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("New password and confirm password do not match.");
      return;
    }

    const token = window.localStorage.getItem("access_token");
    if (!token) {
      setFormError("You are not logged in. Please log in again.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Password change failed");
      }

      setFormMessage(payload?.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Password change failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">

      <form className="space-y-8 text-[#0B3C5D] text-sm" onSubmit={handleSubmit}>

        {/* First Name */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="w-full bg-white border border-[#E6EEF5] rounded px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#1E73BE]"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="w-full bg-white border border-[#E6EEF5] rounded px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#1E73BE]"
          />
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full bg-white border border-[#E6EEF5] rounded px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#1E73BE]"
          />
          <p className="mt-2 text-xs text-[#6B7280] italic">
            This will be how your name will be displayed in the account section and in reviews
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full bg-white border border-[#E6EEF5] rounded px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#1E73BE]"
          />
        </div>

        {/* Divider */}
        <hr className="border-[#E6EEF5]" />

        {/* Password Change */}
        <div>
          <h3 className="text-xs font-semibold uppercase mb-6">
            Password Change
          </h3>

          <div className="space-y-6">

            <div>
              <label className="block text-xs font-semibold uppercase mb-2">
                Current Password (leave blank to leave unchanged)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full bg-white border border-[#E6EEF5] rounded px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#1E73BE]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-2">
                New Password (leave blank to leave unchanged)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full bg-white border border-[#E6EEF5] rounded px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#1E73BE]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full bg-white border border-[#E6EEF5] rounded px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#1E73BE]"
              />
            </div>

          </div>
        </div>

        {formMessage && (
          <div className="rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
            {formMessage}
          </div>
        )}
        {formError && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        {/* Save Button */}
        <div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded bg-[#E5EDF4] px-6 py-2.5 text-xs font-semibold uppercase text-[#0B3C5D] hover:bg-[#D7E6F2] transition"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </form>

    </div>
  );
}
