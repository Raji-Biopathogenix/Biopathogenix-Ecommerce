


"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { EmailIcon, FacebookIcon, LinkedInIcon, TwitterIcon } from "@/components/app_icons/app_icons";

const SHARE_TITLE = "Share";

type ShareTarget = {
  label: string;
  href: (url: string) => string;
  icon: ComponentType;
};

const shareTargets: ShareTarget[] = [
  {
    label: "Facebook",
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: FacebookIcon,
  },
  {
    label: "X",
    href: (url) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
    icon: TwitterIcon,
  },
  {
    label: "LinkedIn",
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: LinkedInIcon,
  },
  {
    label: "Email",
    href: (url) => `mailto:?subject=${encodeURIComponent("Check this out")}&body=${encodeURIComponent(url)}`,
    icon: EmailIcon,
  },
];

export default function ShareIcons() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!currentUrl) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ url: currentUrl, title: document.title || SHARE_TITLE });
        return;
      } catch {
        // Fall back to copy if the native share sheet is dismissed or unavailable.
      }
    }

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-gray-600">
      <span className="font-medium uppercase tracking-[0.2em] text-gray-500">{SHARE_TITLE}</span>
      <div className="flex items-center gap-2">
        {shareTargets.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={currentUrl ? href(currentUrl) : "#"}
            target="_blank"
            rel="noreferrer"
            aria-label={`Share on ${label}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-[#1e6fb5] hover:text-[#1e6fb5]"
          >
            <Icon />
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-gray-200 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-gray-600 transition hover:border-[#1e6fb5] hover:text-[#1e6fb5]"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
