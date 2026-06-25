"use client";

import { useState } from "react";
import "../../../components/my-account/my-account.css";
import { fetchJson } from "@/lib/api";

type MessageResponse = {
  message?: string;
  status?: string;
  error?: string;
};

export default function LostPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetchJson<MessageResponse>("/v1/send-otp/",
        {
          method: "POST",
          body: { email: email.trim() },
        }
      );
      setIsOtpSent(true);
      setMessage(response.message || "OTP sent. Check your email.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send OTP.";
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetPassword = async () => {
    setMessage(null);
    setError(null);

    if (!email.trim() || !otp.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchJson<MessageResponse>(
        "/superadmin/forgot-password/",
        {
          method: "POST",
          body: {
            email: email.trim(),
            otp: otp.trim(),
            password,
            confirm_password: confirmPassword,
          },
        }
      );
      setMessage(response.message || "Password reset successful.");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reset password.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="my-account-page">
      <div className="account-container">

        <h1 className="account-title">My Account</h1>

        <p className="lost-description">
          Lost your password? Enter your email to receive a one-time code, then set a new
          password.
        </p>

        <div className="lost-form-wrapper">
          <label className="lost-label">
            USERNAME OR EMAIL <span>*</span>
          </label>

          <input
            type="text"
            className="lost-input"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <div className="lost-actions">
            <button
              className="lost-btn"
              onClick={handleSendOtp}
              disabled={isSending}
              type="button"
            >
              {isSending ? "SENDING..." : isOtpSent ? "RESEND OTP" : "SEND OTP"}
            </button>
          </div>

          {isOtpSent && (
            <>
              <label className="lost-label">
                OTP CODE <span>*</span>
              </label>
              <input
                type="text"
                className="lost-input"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter the code from your email"
              />

              <label className="lost-label">
                NEW PASSWORD <span>*</span>
              </label>
              <input
                type="password"
                className="lost-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <label className="lost-label">
                CONFIRM PASSWORD <span>*</span>
              </label>
              <input
                type="password"
                className="lost-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />

              <div className="lost-actions">
                <button
                  className="lost-btn"
                  onClick={handleResetPassword}
                  disabled={isSubmitting}
                  type="button"
                >
                  {isSubmitting ? "RESETTING..." : "RESET PASSWORD"}
                </button>
              </div>
            </>
          )}

          {/* {message && <div className="lost-message">{message}</div>}
          {error && <div className="lost-error">{error}</div>} */}
        </div>

      </div>
    </section>
  );
}
