"use client";

import { X } from "lucide-react";
import ValidationTeamForm from "@/components/validation-services/ValidationTeamForm";

type ValidationContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ValidationContactModal({ isOpen, onClose }: ValidationContactModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#0b2749]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Contact validation team form"
      onClick={onClose}
    >
      <div
        className="relative my-6 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-6 py-4">
          <div className="h-4 w-28 rounded-full bg-[#d9ecd7]" />
          <div className="flex items-center gap-3">
            <span className="h-3 w-10 rounded-full bg-[#d4d4d8]" />
            <span className="h-3 w-10 rounded-full bg-[#d4d4d8]" />
            <span className="h-3 w-10 rounded-full bg-[#d4d4d8]" />
          </div>
        </div>

        <div className="relative max-h-[calc(100vh-7.5rem)] overflow-y-auto p-4 md:p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 text-[#123669] hover:bg-[#e7eef6]"
            aria-label="Close form"
          >
            <X className="h-5 w-5" />
          </button>
          <ValidationTeamForm inModal onSubmitted={onClose} showHeading />
        </div>
      </div>
    </div>
  );
}
