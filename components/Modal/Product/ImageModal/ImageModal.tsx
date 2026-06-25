"use client";

import { useEffect, useRef, useState } from "react";

export interface ProductImages{
    is_primary:boolean
    image:string
    alt_text:string
}


interface ImageModalProps {
  images: ProductImages[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const ImageModal: React.FC<ImageModalProps> = ({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setActiveIndex((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft")  setActiveIndex((i) => Math.max(i - 1, 0));
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, images?.length, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "#fff" }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <style>{`
        @keyframes imgFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        .img-fade { animation: imgFadeIn 0.2s ease both; }
      `}</style>

      <div className="absolute top-5 left-6 text-sm font-medium text-gray-500 select-none z-10">
        {activeIndex + 1} / {images.length}
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <button
        onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
        disabled={activeIndex === 0}
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-[#0b2e59] hover:border-[#0b2e59] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="w-full h-full flex items-center justify-center px-16 sm:px-24 py-12">
        <img
          key={activeIndex}
          src={images[activeIndex]?.image}
          alt={`Product image ${images[activeIndex]?.alt_text + 1}`}
          className="img-fade max-w-full max-h-full object-contain select-none"
          style={{ maxHeight: "calc(100vh - 6rem)" }}
        />
      </div>

      <button
        onClick={() => setActiveIndex((i) => Math.min(i + 1, images.length - 1))}
        disabled={activeIndex === images.length - 1}
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-[#0b2e59] hover:border-[#0b2e59] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? "1.5rem" : "0.5rem",
                height: "0.5rem",
                background: i === activeIndex ? "#0b2e59" : "#d1d5db",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageModal;