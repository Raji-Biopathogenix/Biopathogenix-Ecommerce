
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { OrderShipment, Shipment, OrderItemShipment, ReturnResponse } from '@/types/admin_order';
import { useInitiateReturn } from '@/components/hooks/useInitiateReturn';

interface InitiateReturnModalProps {
  order: OrderShipment;
  onClose: () => void;
  onSuccess: (result: ReturnResponse) => void;
}

const SHIPMENT_STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  label_created: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Label created' },
  picked_up:     { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Picked up'     },
  in_transit:    { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In transit'    },
  delivered:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Delivered'     },
  cancelled:     { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cancelled'     },
};

// Item row inside modal 
function ReturnItemRow({
  item,
  shipmentStatus,
  isSelected,
  onToggle,
}: {
  item: OrderItemShipment;
  shipmentStatus: string;
  isSelected: boolean;
  onToggle: (id: number) => void;
}) {
  const returnable = item.is_returnable;

  const pill = () => {
    if (item.is_returned)
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">Already returned</span>;
    if (item.return_status === 'requested')
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">Return pending</span>;
    if (!returnable)
      return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 capitalize">{shipmentStatus.replace('_', ' ')}</span>;
    return null;
  };

  return (
    <label
      className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg transition-colors
        ${!returnable
          ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100'
          : isSelected
            ? 'border-orange-300 bg-orange-50 cursor-pointer'
            : 'border-gray-100 hover:bg-gray-50 cursor-pointer'
        }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        disabled={!returnable}
        onChange={() => returnable && onToggle(item.id)}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 rounded accent-orange-500 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
        <p className="text-xs text-gray-400">SKU: {item.product_sku} · Qty: {item.quantity}</p>
      </div>
      {pill()}
    </label>
  );
}

// Shipment group inside modal 
function ShipmentGroup({
  shipment,
  selectedIds,
  onToggle,
}: {
  shipment: Shipment;
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const badge = SHIPMENT_STATUS_BADGE[shipment.status] ?? SHIPMENT_STATUS_BADGE.in_transit;
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Shipment #{shipment.id}
        </span>
        <span className="text-xs font-mono text-gray-400 truncate">
          · {shipment.tracking_number}
        </span>
        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
      </div>
      <div className="space-y-1.5 pl-1">
        {shipment.items.map((item) => (
          <ReturnItemRow
            key={item.id}
            item={item}
            shipmentStatus={shipment.status}
            isSelected={selectedIds.includes(item.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

// Main Modal 
export default function InitiateReturnModal({
  order,
  onClose,
  onSuccess,
}: InitiateReturnModalProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const { loading, error, initiateReturn } = useInitiateReturn();

  const toggleItem = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const canSubmit = selectedIds.length > 0 && reason.trim().length > 0 && !loading;

  const handleSubmit = async () => {
    
    if (!canSubmit) return;
    const result = await initiateReturn(order.id, {
      item_ids: selectedIds,
      reason: reason.trim(),
    });
    if (result) {
      onSuccess(result);
      onClose();
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 id="return-modal-title" className="text-base font-semibold text-gray-900">
              Initiate return
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Order #{order.id} · Select items to return
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-400 hover:text-gray-600 hover:bg-gray-100
                       transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* No returnable items */}
          {!order.outbound_shipments.some((s) => s.items.some((i) => i.is_returnable)) && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No items eligible for return yet.</p>
              <p className="text-xs mt-1 text-gray-300">
                Items can only be returned after their shipment is delivered.
              </p>
            </div>
          )}

          {/* Items by shipment */}
          {order.outbound_shipments.map((shipment) => (
            <ShipmentGroup
              key={shipment.id}
              shipment={shipment}
              selectedIds={selectedIds}
              onToggle={toggleItem}
            />
          ))}

          {/* Selection summary */}
          {selectedIds.length > 0 && (
            <div className="px-3 py-2.5 bg-orange-50 border border-orange-100
                            rounded-lg text-xs text-orange-700 font-medium">
              {selectedIds.length} item(s) selected for return
            </div>
          )}

          {/* Return reason */}
          <div>
            <label
              htmlFor="return-reason"
              className="block text-xs font-semibold text-gray-700 uppercase
                         tracking-wide mb-1.5"
            >
              Return reason <span className="text-orange-400">*</span>
            </label>
            <textarea
              id="return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damaged on arrival, wrong item received..."
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                         text-sm text-gray-800 placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-orange-400
                         focus:border-transparent resize-none transition-shadow"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {reason.trim().length} / 500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg
                            text-sm text-red-600 flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200
                       text-gray-700 rounded-lg text-sm font-medium
                       transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600
                       text-white rounded-lg text-sm font-medium transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
                Processing...
              </>
            ) : (
              `Return ${selectedIds.length || ''} item(s)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
