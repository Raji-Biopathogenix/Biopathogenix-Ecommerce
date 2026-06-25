import React, { useState } from 'react';
import { X, AlertTriangle, RotateCcw, ShieldAlert, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OrderServices } from "@/services/orderServices";

interface CancelItemModalProps {
    item: {
        id: number;
        product_name: string;
        product_sku: string;
        quantity: number;
        is_cancelled: boolean;
        cancel_notes: string | null;
    };
    orderId: number;
    onClose: () => void;
    onSuccess: (itemId: number) => void;
}

type Step = 'form' | 'confirm' | 'done';

export default function CancelItemModal({
    item,
    orderId,
    onClose,
    onSuccess,
}: CancelItemModalProps) {
    const { setShowMainPageLoader } = useAuth()

    const [step, setStep] = useState<Step>('form');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    //  Submit notes → go to confirm 
    const handleSubmit = () => {
        if (!notes.trim()) {
            setError("Cancel notes cannot be empty.");
            return;
        }
        setError(null);
        setStep('confirm');
    };

    //  Confirmed → call API 
    const handleConfirm = async () => {

        setLoading(true);
        setError(null);
        setShowMainPageLoader(true)
        try {
            let payload = { 'cancel_notes': notes.trim() }
            const res = await OrderServices.CancelOrderItem(orderId,item.id, payload)
            if (res?.status === "success") {
                setStep('done');
                onSuccess(item.id);
                return;
            }
            setStep('form');
            return null;
        } catch (error: any) {
            setStep('form');
            setError(error?.message);
            return null;
        } finally {
            setShowMainPageLoader(false)
            setLoading(false);
        }
    };

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && step !== 'done') onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={handleBackdrop}
        >
            {
                item && item?.is_cancelled ? (
                    <div
                        className="absolute top-4 left-4 bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1"> {item?.cancel_notes}</div>
                ) :

                    <div
                        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl
                   flex flex-col overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                    >

                        {/* FORM STEP */}
                        {step === 'form' && (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-4
                            border-b border-gray-100">
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-900">
                                            Cancel Item
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">
                                            {item.product_name}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg
                           text-gray-400 hover:text-gray-600 hover:bg-gray-100
                           transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="px-5 py-4 space-y-4">

                                    {/* Item info */}
                                    <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50
                              border border-gray-100 rounded-xl">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {item.product_name}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                SKU: {item.product_sku} · Qty: {item.quantity}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500
                                  uppercase tracking-wide mb-1.5">
                                            Cancel notes <span className="text-red-600 font-normal">*</span>
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="e.g. Customer requested cancellation, out of stock..."
                                            rows={3}
                                            maxLength={500}
                                            autoFocus
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                             text-sm text-gray-800 placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-red-200
                             focus:border-transparent resize-none transition-shadow"
                                        />
                                        <p className="text-xs text-gray-400 mt-1 text-right">
                                            {notes.length} / 500
                                        </p>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50
                                border border-red-100 rounded-lg text-xs text-red-600">
                                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                            {error}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex gap-2 px-5 pb-5">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-2.5 border border-gray-200 rounded-xl
                           text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white
                           rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </>
                        )}


                        {/* CONFIRM STEP */}
                        {step === 'confirm' && (
                            <div className="flex flex-col items-center text-center px-6 py-8 space-y-5">

                                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center
                            justify-center">
                                    <ShieldAlert className="w-8 h-8 text-red-500" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        Are you sure you want to proceed?
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        <span className="font-medium text-gray-800">
                                            {item.product_name}
                                        </span>{' '}
                                        will be permanently cancelled.
                                    </p>
                                    {notes.trim() && (
                                        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg
                               px-3 py-2 mt-1">
                                            Note: {notes.trim()}
                                        </p>
                                    )}
                                    <p className="text-xs text-red-400 font-medium">
                                        This action cannot be undone.
                                    </p>
                                </div>

                                <div className="flex gap-3 w-full pt-1">
                                    <button
                                        onClick={() => setStep('form')}
                                        disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5
                           border border-gray-200 rounded-xl text-sm text-gray-600
                           hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        No, go back
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5
                           bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm
                           font-medium transition-colors disabled:opacity-50
                           disabled:cursor-not-allowed"
                                    >
                                        {loading
                                            ? <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                                            : <CheckCircle className="w-3.5 h-3.5" />
                                        }
                                        {loading ? 'Cancelling...' : 'Yes, cancel item'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* DONE STEP */}
                        {step === 'done' && (
                            <div className="flex flex-col items-center text-center px-6 py-8 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center
                            justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        Item Cancelled
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {item.product_name} has been successfully cancelled.
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700
                         rounded-xl text-sm font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}

                    </div>
            }
        </div>
    );
}
