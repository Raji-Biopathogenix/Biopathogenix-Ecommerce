import { useState, useMemo } from "react";
import { OrderSummary } from "@/types/order";
import { orderEditPayload, OrderShipment, OrderItemShipment, ReturnResponse } from "@/types/admin_order";
import StatusBadge from "./StatusBadge";
import InitiateReturnModal from "./InitiateReturnModal";
import AddShipmentDropdown from "./AddShipmentDropdown";
import ShipmentCard from "./ShipmentCard";
import CancelItemModal from "./CancelItemModal";
import { Ban } from 'lucide-react';


interface OrderEditModalProps {
    order: OrderShipment;
    onClose: () => void;
    amount: Number;
    onSubmit: (payload: orderEditPayload) => Promise<void>;
    onRefresh: (order: OrderShipment) => void;
}

const STATUS_OPTIONS = [
    { label: "Processing", value: "processing" },
    { label: "Partially Shipped", value: "partially_shipped" },
    { label: "Shipped", value: "shipped" },
    { label: "Partially Delivered", value: "partially_delivered" },
    { label: "Delivered", value: "delivered" },
    { label: "Returned", value: "returned" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
];

export default function AdminOrderEditModal({ order, onRefresh, onClose, onSubmit }: OrderEditModalProps) {

    console.log("Order in edit modal", order);

    const [transactionId, setTransactionId] = useState<string>(order?.transaction_id || "");
    const [txnTouched, setTxnTouched] = useState<boolean>(false);
    const [returnSuccess, setReturnSuccess] = useState<ReturnResponse | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const isTxnValid = transactionId.trim().length >= 4;
    const [showReturnModal, setShowReturnModal] = useState(false);

    const [selectedStatus, setSelectedStatus] = useState<string>(order.status);
    const [statusLoading, setStatusLoading] = useState<boolean>(false);



    const handleSubmit = async () => {
        if (!isTxnValid) return;
        setLoading(true);
        try {
            await onSubmit({ "orderId": order.id, transactionId });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleStatusSubmit = async () => {
        if (selectedStatus === order.status) return;
        setStatusLoading(true);
        try {
            await onSubmit({ orderId: order.id, status: selectedStatus as OrderShipment["status"] });
            onRefresh(order);
        } finally {
            setStatusLoading(false);
        }
    };



    const isSubmitDisabled = !isTxnValid || loading;

    const handleReturnSuccess = (result: ReturnResponse) => {
        setReturnSuccess(result);
        onRefresh(order);
        setTimeout(() => setReturnSuccess(null), 5000);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()} >
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-xxl mx-4 shadow-sm   min-h-[500px] max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between p-5 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h12M2 4l2 8h8l2-8" stroke="#364153" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 7v3M10 7v3" stroke="#364153" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Order Edit
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5 cursor-pointer"
                    >
                        &#x2715;
                    </button>
                </div>



                <ModalHeader order={order} onRefresh={onRefresh} setShowReturnModal={setShowReturnModal} />

                <div className="px-5 pb-1 flex flex-col gap-1.5">
                    <label htmlFor="order_status" className="text-xs font-medium text-gray-600">
                        Order Status
                    </label>
                    <div className="flex gap-2">
                        <select
                            id="order_status"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="flex-1 h-11 px-3 text-sm text-gray-800 bg-white border
                                       border-gray-200 rounded-lg outline-none focus:border-gray-400"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleStatusSubmit}
                            disabled={selectedStatus === order.status || statusLoading}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-green-50 text-green-600
                                       border border-green-200 hover:opacity-90 disabled:opacity-40
                                       disabled:cursor-not-allowed transition-opacity"
                        >
                            {statusLoading ? "Updating…" : "Update status"}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400">Use this to correct the status manually if something went wrong.</p>
                </div>

                {order?.payment_method !== "card" && <div className="p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="transaction_id" className="text-xs font-medium text-gray-600">
                            Transaction ID
                        </label>
                        <div
                            className={`flex items-center border rounded-lg overflow-hidden transition-all duration-150
                                ${txnTouched && !isTxnValid
                                    ? "border-red-300 ring-1 ring-red-200"
                                    : isTxnValid
                                        ? "border-green-300 ring-1 ring-green-100"
                                        : "border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-200"
                                }`}
                        >
                            <span className="px-3 h-11 flex items-center text-xs font-medium text-gray-400 bg-gray-50 border-r border-gray-200 select-none">
                                TXN
                            </span>
                            {transactionId ? <span className="flex-1 flex items-center h-11 px-1 text-sm text-gray-800 placeholder:text-gray-300 bg-white outline-none"> {transactionId} </span>
                                :
                                <input
                                    id="transaction_id"
                                    type="text"
                                    value={transactionId}
                                    placeholder="e.g. 20250414-0042"
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    onBlur={() => setTxnTouched(true)}
                                    className="flex-1 h-11 px-3 text-sm text-gray-800 placeholder:text-gray-300 bg-white outline-none"
                                />
                            }
                            {isTxnValid && (
                                <span className="pr-3 text-green-500">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                        <path d="M3 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            )}
                            {txnTouched && !isTxnValid && (
                                <span className="pr-3 text-red-400">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                        <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.4" />
                                        <path d="M7.5 5v3M7.5 10h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    </svg>
                                </span>
                            )}
                        </div>
                        {/* Hint / error */}
                        {txnTouched && !isTxnValid ? (
                            <p className="text-xs text-red-500">Enter a valid transaction ID (min 4 characters)</p>
                        ) : (
                            <p className="text-xs text-gray-400">Payment gateway reference for this order</p>
                        )}
                    </div>
                </div>}

                {/* Footer */}
                {order?.payment_method !== "card" && <div className="flex gap-2 px-5 pb-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="flex-[2] py-2 text-sm font-medium rounded-lg bg-green-50 text-green-600 cursor-pointer
                            border border-green-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                        {loading ? "Submitting…" : "Update Transaction ID"}
                    </button>
                </div>}

                <StatStrip order={order}/>
                <OrderItemSection order={order}   onRefresh={onRefresh}/>
                <OutboundSection order={order} />
                <ReturnSection order={order} />


                {returnSuccess && (
                    <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200
                                    rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 max-w-sm">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center
                                    justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0
                            011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Return initiated</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {returnSuccess.items.length} item(s) · Tracking:{' '}
                                <span className="font-mono">{returnSuccess.tracking_number}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => setReturnSuccess(null)}
                            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* ── Return Modal ── */}
                {showReturnModal && (
                    <InitiateReturnModal
                        order={order}
                        onClose={() => setShowReturnModal(false)}
                        onSuccess={handleReturnSuccess}
                    />
                )}


            </div>
        </div>
    );
}








function ModalHeader({ order, onRefresh, setShowReturnModal }: { order: OrderShipment, onRefresh: (order: OrderShipment) => void, setShowReturnModal: (show: boolean) => void }) {


    // Items with no shipment yet
    const unshippedItems: OrderItemShipment[] = useMemo(() => {
        const shippedItemIds = new Set(order.outbound_shipments.flatMap((s) => s.items.map((i) => i.id)));
        return order?.items?.filter((item) => !shippedItemIds.has(item.id) && !item.is_cancelled);
    }, [order]);

    // Return button: enabled only when at least one item delivered
    const hasDeliveredItem = order.outbound_shipments.some((s) => s.status === 'delivered');

    console.log("Unshipped items for order", order.id, unshippedItems);


    return (<>

        <div className="flex items-start justify-between gap-4  p-5 flex-wrap">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">
                    Order #{order.id}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                    {order.customer_name} · Placed{' '}
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                    })}
                </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={order.status} />

                {/* Add shipment — only if unshipped items exist */}
                {unshippedItems.length > 0 && (
                    <AddShipmentDropdown
                        order={order}
                        orderId={order.id}
                        unshippedItems={unshippedItems}
                        onShipmentCreated={onRefresh}
                    />
                )}

                {/* Initiate return — only if at least one item delivered */}
                {hasDeliveredItem && (
                    <button
                        onClick={() => setShowReturnModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-orange-500
                         hover:bg-orange-600 text-white text-sm font-medium
                         rounded-lg transition-colors"
                    >
                        ↩ Initiate return
                    </button>
                )}
            </div>
        </div>


    </>)


}




function StatStrip({ order  }: { order: OrderShipment }) {

    const stats = useMemo(() => {
        let delivered = 0, inTransit = 0, unshipped = 0;
        order.items.forEach((item) => {
            if (item.status === 'delivered') delivered += item.quantity;
            else if (item.status === 'in_transit') inTransit += item.quantity;
            else unshipped += item.quantity;
        });
        return { delivered, inTransit, unshipped };
    }, [order.items]);


    return (

        <div className="grid grid-cols-4 p-5 gap-3">
            {[
                { label: 'Total items', value: order.items.length, color: 'text-gray-900' },
                { label: 'Delivered', value: stats.delivered, color: 'text-green-600' },
                { label: 'In transit', value: stats.inTransit, color: 'text-purple-600' },
                { label: 'Unshipped', value: stats.unshipped, color: stats.unshipped > 0 ? 'text-amber-600' : 'text-green-600' },
            ].map((s) => (
                <div key={s.label}
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-[11px] text-gray-400 mb-1">{s.label}</p>
                    <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                </div>
            ))}
        </div>


    )
}


function OrderItemSection({ order,onRefresh }: { order: OrderShipment , onRefresh: (order: OrderShipment) => void}) {
    const [cancelItem, setCancelItem] = useState<OrderItemShipment | null>(null);

    const getItemStatusPill = (item: OrderItemShipment) => {
        if (item.is_returned)
            return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">Returned</span>;
        else if (item.return_status === 'initiated')
            return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">Return Initiated</span>;
        else if (item.status)
            return <StatusBadge status={item.status} size="sm" />;
        
        else
            return <button
                  onClick={() => setCancelItem(item)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px]
                             font-medium text-red-500 border border-red-200
                             hover:bg-red-50 rounded-lg transition-colors
                             whitespace-nowrap"
                >
                  <Ban className="w-3 h-3" />
                  Cancel item
                </button>;

    };

    const handleCancelSuccess = (itemId: number) => {
        onRefresh(order);
    };



    return (
        <div className="bg-white border border-gray-100 rounded-xl px-5 py-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Order items
            </p>
            <div className="divide-y divide-gray-50">
                {order.items.map((item) => (
                    <div key={item.id} className={`flex items-center gap-3 py-2.5 text-sm ${item.is_cancelled ? "opacity-50" : ""}`}>
                        <span className="flex-1 font-medium text-gray-800 text-sm">
                            {item.product_name}
                        </span>
                        <span className="text-gray-400 text-xs">
                            {item.product_sku}
                        </span>
                        <span className="text-gray-500 text-xs w-6 text-right">
                            ×{item.quantity}
                        </span>
                        {getItemStatusPill(item)}
                    </div>
                ))}
            </div>



            {cancelItem && (
                <CancelItemModal
                    item={cancelItem}
                    orderId={order.id}
                    onClose={() => setCancelItem(null)}
                    onSuccess={handleCancelSuccess}
                />
            )}
        </div>
    )

}


function OutboundSection({ order }: { order: OrderShipment }) {

    return (<>

        {order.outbound_shipments.length > 0 && (
            <div className="p-5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Outbound shipments ({order.outbound_shipments.length})
                </p>
                <div className="space-y-2">
                    {order.outbound_shipments.map((s, idx) => (
                        <ShipmentCard
                            key={s.id}
                            shipment={s}
                            defaultOpen={idx === 0}
                        />
                    ))}
                </div>
            </div>
        )}

    </>)
}

function ReturnSection({ order }: { order: OrderShipment }) {
    return (<>
        {order.return_shipments.length > 0 && (
            <div className="p-5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase
                        tracking-wider mb-3">
                    Returns ({order.return_shipments.length})
                </p>
                <div className="space-y-2">
                    {order.return_shipments.map((s) => (
                        <ShipmentCard key={s.id} shipment={s} defaultOpen />
                    ))}
                </div>
            </div>
        )}
    </>)
}

