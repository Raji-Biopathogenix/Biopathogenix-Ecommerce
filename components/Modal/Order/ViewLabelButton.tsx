import React, { useState } from 'react';
import { Printer, Download, RotateCcw } from 'lucide-react';
import { API_BASE_URL } from "@/config/env";
import { useAuth } from '@/context/AuthContext';

interface PrintLabelButtonProps {
    shipmentId: number;
    trackingNumber: string;
    isReturn?: boolean;
    hasLabel?: boolean;
    shipping_label?: string | null;
}

export default function ViewLabelButton({
    shipmentId,
    trackingNumber,
    isReturn = false,
    hasLabel = true,
    shipping_label
}: PrintLabelButtonProps) {
    const [downloading, setDownloading] = useState(false);
    const { setShowMainPageLoader } = useAuth()

    // Open print page in new tab 
    const handlePrint = (e:React.MouseEvent) => {
        e?.preventDefault();
        if (!shipping_label) return;
        window.open(`/shipments/${shipmentId}/print?mode=paper`, '_blank', 'noopener,noreferrer');



        
    };



    const handleDownload = async () => {
        if (downloading) return;

        setDownloading(true);
        setShowMainPageLoader(true);

        try {
            const token =localStorage.getItem('access_token')

            const res = await fetch(`${API_BASE_URL}/v1/shipments/${shipmentId}/label/download`,{
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });

            if (!res.ok) {
                throw new Error('Download failed');
            }
            const blob = await res.blob();

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `label_${trackingNumber}.gif`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

        } catch (err) {
            console.error('Download error:', err);
        } finally {
            setDownloading(false);
            setShowMainPageLoader(false);
        }
    };

    if (!hasLabel) return null;

    return (
        <div className="flex gap-2 mt-3">
            {/* Print */}
            <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs
                   bg-blue-600 hover:bg-blue-700 text-white
                   rounded-lg transition-colors font-medium"
            >
                <Printer className="w-3.5 h-3.5" />
                Print Label
            </button>

            {/* Download */}
            <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs
                   bg-gray-100 hover:bg-gray-200 text-gray-700
                   rounded-lg transition-colors font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {downloading
                    ? <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    : <Download className="w-3.5 h-3.5" />
                }
                {downloading ? 'Downloading...' : 'Download'}
            </button>
        </div>
    );
}
