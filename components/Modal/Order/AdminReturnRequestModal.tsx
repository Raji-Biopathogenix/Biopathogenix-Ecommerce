import { useState } from "react";
import { OrderSummary } from "@/types/order";



export interface OrderSummaryProps {
    order: OrderSummary
    type: string
}

interface ReturnRequestModalProps {
    orderData: OrderSummaryProps;
    onClose: () => void;
    amount: Number;
    onSubmit: (orderId: number,type:string, note: string,refundamt:Number) => Promise<void>;
}

export default function AdminOrderEditModal({ orderData, amount,onClose, onSubmit }: ReturnRequestModalProps) {
    const {order,type} = orderData 
    const [note, setNote] = useState<string>("");
    const [refundamt, setRefundAmt] = useState<Number>(amount);

    const [loading, setLoading] = useState<boolean>(false);
    const handleSubmit = async () => {
        if (type === "return_rejected" && !note) return;
        if(type === "return_approved" && !refundamt)  return
        setLoading(true);
        try {
            await onSubmit(order.id,type,note,refundamt);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md mx-4">

                {/* Header */}
                <div className="flex items-start justify-between p-5 pb-0">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h12M2 4l2 8h8l2-8" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 7v3M10 7v3" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{type== "return_approved" ? "Refund The Amount":"Reject The Request"}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Order #{order.id} &nbsp;·&nbsp; {order.customer_name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5"
                    >
                        &#x2715;
                    </button>
                </div>
                <div className="p-5 flex flex-col gap-4">

                    <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-400">Order date</p>
                            <p className="text-sm font-medium mt-0.5">
                                {new Date(order.created_at).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric",
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Amount paid</p>
                            <p className="text-sm font-medium mt-0.5">${order.amount}</p>
                        </div>
                    </div>

                   

                    {order.return_requested_reason && <div className="cursor-not-allowed">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                            Return Request Reason{" "}
                        </p>

                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                          {order.return_requested_reason}
                        </p>

                    </div>}


                    <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                            Reject Reason{" "}
                            <span className="normal-case font-normal tracking-normal text-[#DC2626]">*</span>
                        </p>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Describe the issue in more detail..."
                            rows={3}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-2 px-5 pb-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={(type === "return_rejected" && !note) || loading || (type === "return_approved" && !refundamt)}
                        className="flex-[2] py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600
              border border-red-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? "Submitting..." : type== "return_approved" ? "Approve" : "Reject"}
                    </button>
                </div>

            </div>
        </div>
    );
}