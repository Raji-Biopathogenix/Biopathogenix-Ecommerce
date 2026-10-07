"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

export interface VerificationMailProps {
    resMsg: string;
    verificationSucceeded: boolean;
    resultData?: {
        is_verified?: boolean;
        verified?: boolean;
        is_active?: boolean;
        first_name?: string;
        last_name?: string;
        status?: boolean;
    };
}


export default function VerificationMail({ resMsg, resultData, verificationSucceeded }: VerificationMailProps) {
    const isVerified = verificationSucceeded;
    const isActive = Boolean(resultData?.is_active);
    const reviewDialog = useRef<HTMLDialogElement>(null);
    const reviewMessage = "Your email has been verified successfully. Our admin team will review your registration and activate your account after approval. You will receive an email when your account is ready to use.";
    useEffect(() => {
        const dialog = reviewDialog.current;
        if (isVerified && !isActive && dialog && !dialog.open) dialog.showModal();
        return () => dialog?.close();
    }, [isVerified, isActive]);
    const firstName = resultData?.first_name?.trim();
    const greetingName = firstName ? `, ${firstName}` : "";

    return (
        <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center px-4 py-10">
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
                <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        isVerified
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                    }`}
                >
                    {isVerified ? "Email Verified" : "Verification Unsuccessful"}
                </span>

                <h1 className="mt-4 text-2xl font-semibold text-slate-900 md:text-3xl">
                    {isVerified ? `Email Confirmed${greetingName}` : "Unable to Verify Email"}
                </h1>

                <p className="mt-4 text-base leading-7 text-slate-700">
                    {!isVerified ? "We could not verify your email address. Please try your verification link again or contact our support team." : isActive
                        ? "Your email address has been verified and your account is now active. You can continue browsing and place orders as usual."
                        : reviewMessage}
                </p>

                <p className="mt-3 text-sm text-slate-500">{resMsg}</p>

                <div className="mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-md bg-[#113B67] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#113B67] focus-visible:ring-offset-2"
                    >
                        Return to Home Page
                    </Link>
                </div>
            </div>
            <dialog ref={reviewDialog} aria-labelledby="verification-review-title" aria-describedby="verification-review-description"
                className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl backdrop:bg-black/50">
                <h2 id="verification-review-title" className="text-xl font-semibold text-slate-900">Email verified — admin review pending</h2>
                <p id="verification-review-description" className="mt-4 text-sm leading-6 text-slate-700">{reviewMessage}</p>
                <form method="dialog" className="mt-6">
                    <button className="rounded-md bg-[#113B67] px-5 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#113B67] focus-visible:ring-offset-2">Got it</button>
                </form>
            </dialog>
        </section>
    );
}
