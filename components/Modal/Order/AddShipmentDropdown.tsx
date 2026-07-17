import React, { useState, useRef, useEffect } from 'react';
import { useCreateShipment } from '@/components/hooks/useCreateShipment';
import { OrderItemShipment,OrderShipment } from '@/types/admin_order';

interface AddShipmentDropdownProps {
  order: OrderShipment;
  orderId: number;
  unshippedItems: OrderItemShipment[];
  onShipmentCreated: (order: OrderShipment) => void;
}

export default function AddShipmentDropdown({
  order,
  orderId,
  unshippedItems,
  onShipmentCreated,
}: AddShipmentDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [weightLb, setWeightLb] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { loading, error, createShipment } = useCreateShipment();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSelectedIds([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleItem = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!selectedIds.length) return;
    const parsedWeight = parseFloat(weightLb);
    const payload = Number.isFinite(parsedWeight) && parsedWeight > 0
      ? { item_ids: selectedIds, weight_lb: parsedWeight }
      : { item_ids: selectedIds };
    const result = await createShipment(orderId, payload);
    if (result) {
      setOpen(false);
      setSelectedIds([]);
      setWeightLb('');
      onShipmentCreated(order);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600
                   hover:bg-blue-700 text-white text-sm font-medium
                   rounded-lg transition-colors"
      >
        <span className="text-base leading-none">+</span>
        Add shipment
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border
                        border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden">

          {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Select items for this shipment
            </p>
          </div>

          {/* Items */}
          <div className="max-h-56 overflow-y-auto">
            {unshippedItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                All items already shipped
              </p>
            ) : (
              unshippedItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50
                             cursor-pointer border-b border-gray-50 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      SKU: {item.product_sku} · Qty {item.quantity}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Weight override */}
          <div className="px-4 py-2.5 border-t border-gray-100">
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Override weight (lbs)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={weightLb}
              onChange={(e) => setWeightLb(e.target.value)}
              placeholder="Auto-calculated if left blank"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200
                         rounded-lg outline-none focus:border-gray-400"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 px-4 py-2 bg-red-50">{error}</p>
          )}

          {/* Footer */}
          <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => { setOpen(false); setSelectedIds([]); setWeightLb(''); }}
              className="flex-1 px-3 py-2 text-xs text-gray-600 border
                         border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedIds.length || loading}
              className="flex-1 px-3 py-2 text-xs text-white bg-blue-600
                         hover:bg-blue-700 rounded-lg transition-colors font-medium
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Generating...'
                : `Generate label${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
