import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { OrderServices } from '@/services/orderServices';

type Preview = Awaited<ReturnType<typeof OrderServices.previewItemCancellation>>['data'];
interface Props {
  item: { id: number; product_name: string; product_sku: string; quantity: number; is_cancelled: boolean; cancel_notes: string | null };
  orderId: number;
  onClose: () => void;
  onSuccess: (itemId: number) => void;
}

function errorMessage(error: unknown): string {
  const value = error as { response?: { data?: { error?: string } }; message?: string };
  return value.response?.data?.error || value.message || 'Unable to process this cancellation.';
}

export default function CancelItemModal({ item, orderId, onClose, onSuccess }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [notes, setNotes] = useState(item.cancel_notes || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    OrderServices.previewItemCancellation(orderId, item.id)
      .then(result => { if (active) setPreview(result.data); })
      .catch(error => { if (active) setError(errorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId, item.id]);

  async function submit() {
    if (!preview || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await OrderServices.CancelOrderItem(orderId, item.id, {
        cancel_notes: notes.trim(), expected_amount: preview.amount,
      });
      setMessage(result.message);
      onSuccess(item.id);
    } catch (error) {
      setError(errorMessage(error));
      setConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="cancel-item-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 id="cancel-item-title" className="text-lg font-semibold text-[#003550]">{item.is_cancelled ? 'Review item cancellation' : 'Cancel item'}</h2>
        <button aria-label="Close" disabled={submitting} onClick={onClose}><X size={20} /></button>
      </div>
      <p className="mt-3 font-medium">{item.product_name}</p>
      <p className="text-xs text-gray-500">SKU: {item.product_sku} ? Quantity: {item.quantity}</p>
      {loading && <p className="mt-4 text-sm">Calculating adjustment?</p>}
      {preview && <>
        <dl className="my-4 space-y-2 rounded-lg bg-blue-50 p-4 text-sm">
          {[
            ['Item subtotal', preview.subtotal],
            ['Coupon deduction', `-${preview.discount}`],
            ['Shipping share', preview.shipping],
            ['Tax share', preview.tax],
            [preview.paid ? 'Item refund' : 'Invoice reduction', preview.amount],
            ['Remaining order value', preview.remaining_total],
          ].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))}</dd></div>)}
        </dl>
        <p className="text-xs leading-relaxed text-gray-500">The coupon, shipping, and tax are allocated using this item?s share of the original product subtotal. The remaining items stay active.</p>
      </>}
      {!message && <>
        <label className="mt-4 block text-sm font-medium" htmlFor="cancel-item-reason">Cancellation reason</label>
        <textarea id="cancel-item-reason" value={notes} onChange={event => setNotes(event.target.value)} maxLength={500} rows={3} disabled={submitting} className="mt-1 w-full rounded-lg border p-3 text-sm" />
        {confirm && <p className="mt-3 text-sm font-medium text-red-700">Confirm this item cancellation{preview?.paid ? ` and $${preview.amount} refund to the original payment method` : ' and invoice adjustment'}.</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button disabled={submitting} onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Close</button>
          <button disabled={!preview || !notes.trim() || submitting || loading} onClick={() => confirm ? submit() : setConfirm(true)} className="rounded-lg bg-[#006b99] px-4 py-2 text-sm text-white disabled:opacity-50">
            {submitting ? 'Processing?' : confirm ? 'Confirm cancellation' : 'Review and continue'}
          </button>
        </div>
      </>}
      {message && <p role="status" className="mt-4 rounded-lg bg-blue-50 p-3 text-sm">{message}</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    </section>
  </div>;
}
