"use client";
import Link from "next/link";

export interface VerificationMailProps {
    resMsg: string;
    resultData?: {
        is_verified?: boolean;
        first_name?: string;
        last_name?: string;
        status?: boolean;
    };
}


export default function VerificationMail({ resMsg, resultData }: VerificationMailProps) {
    const isVerified = Boolean(resultData?.is_verified || resultData?.status);
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
                    {isVerified ? "Verification Complete" : "Verification Received"}
                </span>

                <h1 className="mt-4 text-2xl font-semibold text-slate-900 md:text-3xl">
                    {isVerified ? `Email Confirmed${greetingName}` : "Email Verified Successfully"}
                </h1>

                <p className="mt-4 text-base leading-7 text-slate-700">
                    {isVerified
                        ? "Your email address has been verified and your account is now active. You can continue browsing and place orders as usual."
                        : "Your email has been verified. Our admin team will review and activate your account shortly."}
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
        </section>
    );
}
