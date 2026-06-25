import React, { useState } from 'react';
import {
  X, AlertTriangle, RotateCcw, Ban,
  DollarSign, ChevronRight, CheckCircle,
  ArrowLeft, ShieldAlert,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { OrderServices } from "@/services/orderServices";
import { CancelResult, RefundResult, CancelRefundEligibility } from '@/types/admin_order';




type Tab  = 'cancel' | 'refund';
type Step =
  | 'select_tab'
  | 'cancel_form'
  | 'cancel_confirm'
  | 'refund_form'
  | 'refund_confirm'
  | 'done';

interface CancelRefundModalProps {
  orderId:     number;
  orderNumber: string | number;
  eligibility: CancelRefundEligibility;
  onClose:     () => void;
  onSuccess:   (result: CancelResult | RefundResult, type: Tab) => void;
}

// Confirm Step 

function ConfirmStep({
  title, description, confirmLabel,
  confirmColor, onConfirm, onBack, loading,
}: {
  title:        string;
  description:  React.ReactNode;
  confirmLabel: string;
  confirmColor: string;
  onConfirm:    () => void;
  onBack:       () => void;
  loading:      boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8 space-y-5">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-500 leading-relaxed">{description}</div>
      </div>
      <div className="flex gap-3 w-full pt-1">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5
                     border border-gray-200 rounded-xl text-sm text-gray-600
                     hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go back
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5
                      rounded-xl text-sm font-medium text-white transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed ${confirmColor}`}
        >
          {loading
            ? <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            : <CheckCircle className="w-3.5 h-3.5" />
          }
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </div>
  );
}

// Done Step 

function DoneStep({ type, result, onClose }: {
  type: Tab; result: CancelResult | RefundResult; onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-gray-900">
          {type === 'cancel' ? 'Order Cancelled' : 'Refund Processed'}
        </h3>
        <p className="text-sm text-gray-500">{result.message}</p>
        {'refund_amount' in result?.data && (
          <p className="text-3xl font-bold text-green-600 pt-1">
            ${result.data?.refund_amount}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700
                   rounded-xl text-sm font-medium transition-colors"
      >
        Close
      </button>
    </div>
  );
}

// Main Modal 

export default function CancelRefundModal({ orderId, orderNumber, eligibility, onClose, onSuccess }: CancelRefundModalProps) {

  console.log(orderId, orderNumber, eligibility, onClose, onSuccess )

  const [step,setStep]= useState<Step>('select_tab');
  const [activeTab,setActiveTab]= useState<Tab>('cancel');
  const [cancelNotes,setCancelNotes]= useState('');
  const [refundAmount,setRefundAmount]= useState(eligibility.total_amount);
  const [refundNotes,setRefundNotes]= useState('');
  const [loading,setLoading]= useState(false);
  const [error,setError]= useState<string | null>(null);
  const [result,setResult]= useState<CancelResult | RefundResult | null>(null);
  const { setShowMainPageLoader } = useAuth()
  

  const totalAmount = parseFloat(eligibility.total_amount);
  const refundAmountNum = parseFloat(refundAmount) || 0;
  const isPartial = refundAmountNum > 0 && refundAmountNum < totalAmount;
  const refundValid = refundAmountNum > 0 && refundAmountNum <= totalAmount;

  // API calls 
  const cancelOrder = async (): Promise<CancelResult | null> => {    
    setLoading(true);
    setError(null);
    setShowMainPageLoader(true)

    
    try {

      let payload = { 'cancel_notes': cancelNotes.trim() }
      const res = await OrderServices.CancelOrder(orderId,payload)
      console.log("CancelOrder response:", res)

      if (res?.status === "success") {
        setStep("done")
        return  res as CancelResult;
      }
      return null;
    } catch(error: any){
      setStep("cancel_form")
      setError(error?.message);
      return null;
    } finally {
      setShowMainPageLoader(false)
      setLoading(false);
    }

  };

  const refundOrder = async (): Promise<RefundResult | null> => {
    // setLoading(true); setError(null);
    // try {
    //   const res  = await fetch(`/api/orders/${orderId}/refund/`, {
    //     method: 'POST', headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       refund_amount:    refundAmountNum,
    //       refund_notes:     refundNotes.trim(),
    //     }),
    //   });
    //   const data = await res.json();
    //   if (!res.ok) { setError(data.error || 'Failed to process refund.'); return null; }
    //   return data as RefundResult;
    // } catch { setError('Network error. Please try again.'); return null; }
    // finally { setLoading(false); }

    setLoading(true);
    setError(null);
    setShowMainPageLoader(true)
    try {

      let payload = {  refund_amount:    refundAmountNum,   refund_notes:     refundNotes.trim(),}
      const res = await OrderServices.RefundOrder(orderId,payload)
      console.log("RefundOrder response:", res)
      if (res?.status === "success") {
        setStep("done")
        return  res as RefundResult;
      }
      return null;
    } catch(error: any){
      setStep("refund_form")

      setError(error?.message);
      return null;
    } finally {
      setShowMainPageLoader(false)
      setLoading(false);
    }

  };

  const handleCancelConfirm = async () => {
    const res = await cancelOrder();
    if (res) { setResult(res); setStep('done'); onSuccess(res, 'cancel'); }
  };

  const handleRefundConfirm = async () => {
    const res = await refundOrder();
    if (res) { setResult(res); setStep('done'); onSuccess(res, 'refund'); }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && step !== 'done') onClose();
  };

  const HEADER_TITLES: Partial<Record<Step, string>> = {
    select_tab:      'Cancel / Refund',
    cancel_form:     'Cancel Order',
    cancel_confirm:  'Confirm Cancellation',
    refund_form:     'Process Refund',
    refund_confirm:  'Confirm Refund',
  };

  // Render 

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl
                   flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >

        {/*  Header */}
        {step !== 'done' && (
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {HEADER_TITLES[step]}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Order #{orderNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         text-gray-400 hover:text-gray-600 hover:bg-gray-100
                         transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/*  SELECT TAB  */}
        {step === 'select_tab' && (
          <div className="px-6 py-5 space-y-3">
            {/* Cancel */}
            <button
              onClick={() => {
                if (!eligibility.is_cancellable) return;
                setActiveTab('cancel'); setStep('cancel_form');
              }}
              disabled={!eligibility.is_cancellable}
              className={`w-full flex items-center gap-4 p-4 border rounded-xl
                          text-left transition-all group
                          ${eligibility.is_cancellable
                            ? 'border-gray-200 hover:border-red-200 hover:bg-red-50/50 cursor-pointer'
                            : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                               flex-shrink-0 transition-colors
                               ${eligibility.is_cancellable ? 'bg-red-100 group-hover:bg-red-200' : 'bg-gray-100'}`}>
                <Ban className={`w-5 h-5 ${eligibility.is_cancellable ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Cancel Order</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {eligibility.is_cancellable
                    ? 'Stop processing and mark as cancelled'
                    : `Cannot cancel — ${eligibility.status.replace(/_/g, ' ')}`}
                </p>
              </div>
              {eligibility.is_cancellable && (
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-300
                                         flex-shrink-0 transition-colors" />
              )}
            </button>

            {/* Refund */}
            <button
              onClick={() => {
                if (!eligibility.is_refundable) return;
                setActiveTab('refund'); setStep('refund_form');
              }}
              disabled={!eligibility.is_refundable}
              className={`w-full flex items-center gap-4 p-4 border rounded-xl
                          text-left transition-all group
                          ${eligibility.is_refundable
                            ? 'border-gray-200 hover:border-green-200 hover:bg-green-50/50 cursor-pointer'
                            : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                               flex-shrink-0 transition-colors
                               ${eligibility.is_refundable ? 'bg-green-100 group-hover:bg-green-200' : 'bg-gray-100'}`}>
                <DollarSign className={`w-5 h-5 ${eligibility.is_refundable ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Process Refund</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {eligibility.is_refundable
                    ? `Refund up to $${eligibility.total_amount}`
                    : eligibility.refund_status === 'processed'
                      ? `Already refunded $${eligibility.refund_amount}`
                      : `Not eligible — ${eligibility.status.replace(/_/g, ' ')}`}
                </p>
              </div>
              {eligibility.is_refundable && (
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-300
                                         flex-shrink-0 transition-colors" />
              )}
            </button>
          </div>
        )}

        {/* CANCEL FORM  */}
        {step === 'cancel_form' && (
          <div className="px-6 py-5 space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-500
                                uppercase tracking-wide mb-1.5">
                Cancellation reason Notes <span className="text-red-400">*</span>
              </label>
              <textarea
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                placeholder="Additional details about the cancellation..."
                rows={2} maxLength={500}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none
                           focus:ring-2 focus:ring-red-200 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{cancelNotes.length} / 500</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border
                              border-red-100 rounded-lg text-xs text-red-600">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep('select_tab')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5
                           border border-gray-200 rounded-xl text-sm text-gray-600
                           hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={() => { setError(null); setStep('cancel_confirm'); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5
                           bg-red-500 hover:bg-red-600 text-white rounded-xl
                           text-sm font-medium transition-colors">
                <Ban className="w-3.5 h-3.5" /> Continue
              </button>
            </div>
          </div>
        )}

        {/* CANCEL CONFIRM */}
        {step === 'cancel_confirm' && (
          <ConfirmStep
            title="Are you sure you want to cancel?"
            description={
              <div className="space-y-2">
                <p>Order <strong>#{orderNumber}</strong> will be permanently cancelled.</p>
                <p className="text-gray-400">Reason: {cancelNotes}</p>
                <p className="text-red-400 text-xs font-medium">This action cannot be undone.</p>
              </div>
            }
            confirmLabel="Yes, cancel order"
            confirmColor="bg-red-500 hover:bg-red-600"
            onConfirm={handleCancelConfirm}
            onBack={() => setStep('cancel_form')}
            loading={loading}
          />
        )}

        {/* REFUND FORM */}
        {step === 'refund_form' && (
          <div className="px-6 py-5 space-y-4">
            {/* Order total */}
            <div className="flex items-center justify-between px-4 py-3
                            bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Order total</span>
              <span className="text-xl font-bold text-gray-900">${eligibility.total_amount}</span>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-500
                                uppercase tracking-wide mb-1.5">
                Refund amount <span className="text-red-400">*</span>
              </label>
              <div className={`flex items-center border rounded-lg overflow-hidden transition-all
                               ${refundAmountNum > totalAmount
                                 ? 'border-red-300 ring-1 ring-red-200'
                                 : refundValid
                                   ? 'border-green-300 ring-1 ring-green-100'
                                   : 'border-gray-200 focus-within:border-green-300 focus-within:ring-1 focus-within:ring-green-100'}`}>
                <span className="px-3 h-11 flex items-center text-sm font-medium text-gray-400
                                 bg-gray-50 border-r border-gray-200 select-none">$</span>
                <input
                  type="number" value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  min="0.01" max={eligibility.total_amount} step="0.01"
                  className="flex-1 h-11 px-3 text-sm text-gray-800 bg-white outline-none"
                />
                <button
                  onClick={() => setRefundAmount(eligibility.total_amount)}
                  className="px-3 h-11 text-xs text-green-600 font-semibold bg-green-50
                             border-l border-gray-200 hover:bg-green-100 transition-colors">
                  Full
                </button>
              </div>
              {isPartial && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  Partial refund — ${(totalAmount - refundAmountNum).toFixed(2)}
                </p>
              )}
              {refundAmountNum > totalAmount && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  Amount exceeds order total of ${eligibility.total_amount}
                </p>
              )}
            </div>

           

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500
                                uppercase tracking-wide mb-1.5">
                Notes (optional)
              </label>
              <textarea
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="Reason for refund..."
                rows={2} maxLength={500}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                           text-gray-800 placeholder:text-gray-400 focus:outline-none
                           focus:ring-2 focus:ring-green-200 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{refundNotes.length} / 500</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border
                              border-red-100 rounded-lg text-xs text-red-600">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep('select_tab')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5
                           border border-gray-200 rounded-xl text-sm text-gray-600
                           hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={() => { setError(null); setStep('refund_confirm'); }}
                disabled={!refundValid}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5
                           bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm
                           font-medium transition-colors disabled:opacity-50
                           disabled:cursor-not-allowed">
                <DollarSign className="w-3.5 h-3.5" /> Continue
              </button>
            </div>
          </div>
        )}

        {/* REFUND CONFIRM */}
        {step === 'refund_confirm' && (
          <ConfirmStep
            title="Are you sure you want to process this refund?"
            description={
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600">
                  ${refundAmountNum.toFixed(2)}
                </p>
                <p>will be refunded for Order <strong>#{orderNumber}</strong>.</p>
                {isPartial && (
                  <p className="text-amber-600 text-xs font-medium">This is a partial refund.</p>
                )}
                
                <p className="text-red-400 text-xs font-medium">This action cannot be undone.</p>
              </div>
            }
            confirmLabel="Yes, process refund"
            confirmColor="bg-green-600 hover:bg-green-700"
            onConfirm={handleRefundConfirm}
            onBack={() => setStep('refund_form')}
            loading={loading}
          />
        )}

        {/* DONE */}
        {step === 'done' && result && (
          <DoneStep type={activeTab} result={result} onClose={onClose} />
        )}

      </div>
    </div>
  );
}
