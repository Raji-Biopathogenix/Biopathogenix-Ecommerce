interface ConfirmModalProps {
  isOpen      : boolean;
  title       : string;
  description : string;
  confirmLabel?: string;
  cancelLabel ?: string;
  onConfirm   : () => void;
  onClose     : () => void;
}

export  default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Yes, clear it",
  cancelLabel  = "No, keep it",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-sm mx-4">

        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 5h12M7 5V4h6v1M6 5l.6 11h6.8L14 5"
                stroke="#DC2626"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
}