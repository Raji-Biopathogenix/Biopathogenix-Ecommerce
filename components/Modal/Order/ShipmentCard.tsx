import React, { useState } from 'react';
import { Shipment } from '@/types/admin_order';
import StatusBadge from './StatusBadge';
import { useAuth } from '@/context/AuthContext';
import ViewLabelButton from './ViewLabelButton';
import {
  Package,
  PackageMinus,
  Truck,
  PackageCheck,
  PackageX,
  Printer,
  Download,
  Copy,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

interface ShipmentCardProps {
  shipment: Shipment;
  defaultOpen?: boolean;
}

export default function ShipmentCard({ shipment, defaultOpen = false }: ShipmentCardProps) {
  const { setShowMainPageLoader } = useAuth()
  
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const isReturn = shipment.shipment_type === 'return';

  const copyTracking = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(shipment.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


   const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!shipment.shipping_label) return;
    setDownloading(true);
    setShowMainPageLoader(true);

    try {
      const res  = await fetch(shipment.shipping_label);
      const blob = await res.blob();

      const blobUrl  = window.URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = blobUrl;
      link.download  = `label_${shipment.tracking_number}.gif`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

    } catch {
      console.error('Download failed');
    } finally {
      setDownloading(false);
      setShowMainPageLoader(false);
    }
  };


  return (
    <div className={`border rounded-xl overflow-hidden bg-white
      ${isReturn ? 'border-orange-200' : 'border-gray-100'}`}>

      {/* ── Collapsed header (always visible) ── */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3
                   hover:bg-gray-50 transition-colors text-left"
      >
        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200
            ${open ? 'rotate-90' : ''}`}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0
               011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd" />
        </svg>

        {/* Title */}
        <span className="font-medium text-sm text-gray-800 flex items-center gap-2 flex-1">
          {isReturn ? <PackageMinus className="w-4 h-4 text-orange-500" /> : <Package className="w-4 h-4 text-blue-500" /> } Shipment #{shipment.id}
          <StatusBadge status={shipment.status} size="sm" />
        </span>

        <span className="text-xs text-gray-400">
          {shipment.item_count ?? shipment.items.length} item(s)
        </span>
        <span className="text-xs text-gray-400">
          {new Date(shipment.label_created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </span>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div className={`px-4 pb-4 border-t
          ${isReturn ? 'border-orange-100 bg-orange-50/30' : 'border-gray-100'}`}>

          {/* Tracking row */}
          <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 text-sm">
            <span className="text-gray-400 w-24 flex-shrink-0 text-xs">Tracking</span>
            <span className="font-mono text-xs font-medium text-gray-800">
              {shipment.tracking_number}
            </span>
            <a
              href={`https://www.ups.com/track?tracknum=${shipment.tracking_number}&requester=ST/trackdetails`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-xs hover:underline ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              Track →
            </a>
            <button
              onClick={copyTracking}
              className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200
                         text-gray-400 hover:bg-gray-100 transition-colors ml-auto"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Carrier row */}
          <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 text-sm">
            <span className="text-gray-400 w-24 flex-shrink-0 text-xs">Carrier</span>
            <span className="font-medium text-gray-800 text-xs">{shipment.carrier}</span>
          </div>

          {/* Return reason (if return shipment) */}
          {isReturn && shipment.return_reason && (
            <div className="flex items-start gap-2 py-2.5 border-b border-gray-100 text-sm">
              <span className="text-gray-400 w-24 flex-shrink-0 text-xs">Reason</span>
              <span className="text-gray-700 text-xs">{shipment.return_reason}</span>
            </div>
          )}

          {/* Initiated by */}
          {isReturn && shipment.initiated_by && (
            <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 text-sm">
              <span className="text-gray-400 w-24 flex-shrink-0 text-xs">Initiated by</span>
              <span className="text-gray-700 text-xs">{shipment.initiated_by}</span>
            </div>
          )}

          {/* Items */}
          <div className="mt-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
              Items in shipment
            </p>
            <div className="space-y-1.5">
              {shipment.items.map((item) => (
                <div key={item.id}
                     className="flex items-center gap-2 bg-gray-50 rounded-lg
                                px-3 py-2 text-xs">
                  <span className="flex-1 font-medium text-gray-800">
                    {item.product_name}
                  </span>
                  <span className="text-gray-400">×{item.quantity}</span>
                  {item.is_returned && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full
                                     bg-orange-100 text-orange-700 font-medium">
                      Returned
                    </span>
                  )}
                  {item.return_status === 'initiated' && !item.is_returned && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full
                                     bg-yellow-100 text-yellow-700 font-medium">
                      Return initiated
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {/* <div className="flex gap-2 mt-3">
            <a
              href={`/orders/${shipment.order}/shipments/${shipment.id}/print`}
              target="_blank"
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700
                         text-white rounded-lg transition-colors font-medium     flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />  Print label 
            </a>
            {shipment.shipping_label && <button onClick={handleDownload}
                  disabled={downloading}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200
                            text-gray-700 rounded-lg transition-colors font-medium
                            disabled:opacity-50 disabled:cursor-not-allowed
                            flex items-center gap-1.5"
                >
                  {downloading ? (
                    <>
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <> <Download className="w-3.5 h-3.5" /> Download</>
                  )}
                </button>}
          </div> */}

         <ViewLabelButton
            shipmentId={shipment.id}
            trackingNumber={shipment.tracking_number}
            isReturn={shipment.is_return}
            hasLabel={!!shipment.shipping_label}
            shipping_label={shipment.shipping_label}

          />
        </div>
      )}
    </div>
  );
}
