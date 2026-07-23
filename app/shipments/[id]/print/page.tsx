'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { OrderServices } from '../../../../services/orderServices';
import { LabelData } from '../../../../types/admin_order';

type PrintMode = 'paper' | 'thermal-label' | 'thermal-products';

const PRINT_MODE_OPTIONS: Array<{ value: PrintMode; label: string }> = [
  { value: 'paper', label: 'Paper Slip + Label' },
  { value: 'thermal-label', label: 'UPS Sticker Label Only' },
  { value: 'thermal-products', label: 'UPS Sticker + Product Sticker' },
];

function resolvePrintMode(rawMode: string | null, rawType: string | null): PrintMode {
  if (rawMode && PRINT_MODE_OPTIONS.some((option) => option.value === rawMode)) {
    return rawMode as PrintMode;
  }

  if (rawType === 'label') {
    return 'paper';
  }

  if (rawType === 'product') {
    return 'paper';
  }

  return 'paper';
}

export default function PrintLabelPage() {
  const [label, setLabel] = useState<LabelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [labelImageLoaded, setLabelImageLoaded] = useState(false);

  const params = useParams();
  const searchParams = useSearchParams();

  const [printMode, setPrintMode] = useState<PrintMode>(
    resolvePrintMode(searchParams.get('mode'), searchParams.get('type'))
  );

  useEffect(() => {
    if (params?.id) {
      const fetchPrintLabel = async () => {
        try {
          const shipmentId = Number(params.id);
          const res = await OrderServices.PrintShipmentLabel(shipmentId);
          if (res?.status === 'success') {
            setLabel(res);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchPrintLabel();
    }
  }, [params?.id]);

  useEffect(() => {
    setPrintMode(resolvePrintMode(searchParams.get('mode'), searchParams.get('type')));
  }, [searchParams]);

  useEffect(() => {
    if (labelImageLoaded) {
      const timeout = window.setTimeout(() => window.print(), 500);
      return () => window.clearTimeout(timeout);
    }
  }, [labelImageLoaded, printMode]);

  const date = useMemo(() => {
    if (!label?.label_created_at) {
      return '';
    }
    return new Date(label.label_created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [label?.label_created_at]);

  const totalItems = useMemo(
    () => label?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [label?.items]
  );

  const handleModeChange = (mode: PrintMode) => {
    setPrintMode(mode);
    setLabelImageLoaded(false);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('mode', mode);
    nextUrl.searchParams.delete('type');
    window.history.replaceState({}, '', nextUrl.toString());
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          color: '#999',
        }}
      >
        Loading...
      </div>
    );
  }

  if (!label) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          color: '#e55',
        }}
      >
        Label not found
      </div>
    );
  }

  const docClassName =
    printMode === 'paper'
      ? 'doc doc-paper'
      : printMode === 'thermal-label'
        ? 'doc doc-thermal-label'
        : 'doc doc-thermal-products';

  const printPageSize = '4in 6in';

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body { background: #e8e8e8; font-family: Arial, Helvetica, sans-serif; color: #111; }

        .toolbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #15202b;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .toolbar-title {
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          flex: 1 1 220px;
        }

        .toolbar-title small {
          color: rgba(255,255,255,0.65);
          font-weight: 400;
          margin-left: 8px;
        }

        .toolbar-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .mode-select {
          height: 36px;
          min-width: 220px;
          border-radius: 8px;
          border: 1px solid #314155;
          background: #fff;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 600;
        }

        .tbtn {
          height: 36px;
          padding: 0 14px;
          border-radius: 8px;
          border: none;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .tbtn-print { background: #2563eb; color: #fff; }
        .tbtn-close { background: #334155; color: #fff; }

        .page-wrap {
          padding: 24px 16px 48px;
          display: flex;
          justify-content: center;
        }

        .doc {
          background: #fff;
          box-shadow: 0 10px 40px rgba(0,0,0,0.18);
        }

        .doc-paper {
          width: 576px;
        }

        .doc-thermal-label,
        .doc-thermal-products {
          width: 4in;
        }

        .slip { padding: 14px 16px 10px; }

        .slip-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .slip-co-name {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .slip-co-web {
          font-size: 9px;
          color: #999;
          margin-top: 1px;
        }

        .slip-meta {
          text-align: right;
        }

        .slip-meta-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .slip-meta-sub {
          font-size: 9px;
          color: #666;
          margin-top: 2px;
        }

        .slip-divider { height: 1px; background: #222; margin: 8px 0; }

        .addresses { display: flex; gap: 0; margin-bottom: 10px; }

        .addr-block { flex: 1; padding: 0 10px 0 0; }

        .addr-block + .addr-block {
          padding: 0 0 0 10px;
          border-left: 1px solid #e0e0e0;
        }

        .addr-label {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 4px;
        }

        .addr-name {
          font-size: 11px;
          font-weight: 700;
          line-height: 1.4;
        }

        .addr-line {
          font-size: 10px;
          color: #555;
          line-height: 1.5;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .items-table thead tr { background: #111; }

        .items-table thead td {
          padding: 5px 8px;
          color: rgba(255,255,255,0.75);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .items-table thead td:last-child { text-align: right; }
        .items-table thead td:nth-child(2) { text-align: center; }
        .items-table thead td:nth-child(3) { text-align: right; }

        .items-table tbody tr { border-bottom: 1px solid #f0f0f0; }
        .items-table tbody tr:nth-child(even) { background: #fafafa; }
        .items-table tbody td { padding: 7px 8px; vertical-align: top; }
        .items-table tbody td:nth-child(2) { text-align: center; font-weight: 700; }
        .items-table tbody td:nth-child(3) { text-align: right; color: #555; }
        .items-table tbody td:nth-child(4) { text-align: right; font-weight: 700; }

        .item-name { font-weight: 700; line-height: 1.3; }
        .item-sku { font-size: 9px; color: #888; font-family: monospace; margin-top: 1px; }

        .totals-row {
          display: flex;
          justify-content: flex-end;
          padding: 6px 8px 0;
        }

        .totals-table { font-size: 11px; min-width: 160px; }
        .totals-table tr td { padding: 2px 0 2px 12px; }
        .totals-table tr td:first-child { color: #777; }
        .totals-table tr td:last-child { text-align: right; font-weight: 600; }

        .totals-total td {
          border-top: 1.5px solid #111 !important;
          padding-top: 5px !important;
          font-weight: 900 !important;
          font-size: 12px;
        }

        .return-note {
          margin: 8px 0 4px;
          padding: 7px 10px;
          background: #fff8f0;
          border-left: 3px solid #f97316;
          font-size: 10px;
          color: #7c3100;
          line-height: 1.5;
        }

        .cut-line {
          position: relative;
          border-top: 1.5px dashed #aaa;
          margin: 10px 0 0;
        }

        .cut-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          padding: 0 8px;
          font-size: 8px;
          color: #bbb;
          letter-spacing: 2px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .label-section img,
        .thermal-label-panel img {
          width: 100%;
          display: block;
        }

        .paper-label-page {
          width: 4in;
          min-height: 6in;
          background: #fff;
          display: flex;
          align-items: stretch;
          justify-content: center;
        }

        .paper-label-panel {
          width: 4in;
          min-height: 6in;
          background: #fff;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .paper-label-rotated {
          width: 6in;
          height: 4in;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(0.28in) rotate(90deg) scale(1.04);
          transform-origin: center center;
          flex: none;
        }

        .paper-label-rotated img {
          width: 6in;
          height: 4in;
          object-fit: contain;
          display: block;
        }

        .thermal-shell {
          padding: 12px;
          background: #fff;
        }

        .thermal-pages {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .thermal-note {
          font-size: 11px;
          line-height: 1.5;
          color: #444;
          padding: 0 2px 12px;
        }

        .thermal-page {
          width: 4in;
          min-height: 6in;
          background: #fff;
          border: 1px solid #dbe2ea;
          overflow: hidden;
          display: flex;
          align-items: stretch;
          justify-content: center;
        }

        .thermal-page + .thermal-page {
          margin-top: 0;
        }

        .thermal-label-panel {
          width: 100%;
          min-height: 6in;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          position: relative;
        }

        .thermal-label-rotated {
          width: 6in;
          height: 4in;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(90deg);
          transform-origin: center center;
          flex: none;
        }

        .thermal-label-rotated img {
          width: 6in;
          height: 4in;
          object-fit: contain;
          display: block;
        }

        .product-sticker {
          width: 100%;
          min-height: 6in;
          margin-top: 0;
          border: 2px solid #111;
          padding: 12px;
          background: #fff;
        }

        .product-sticker-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          border-bottom: 2px solid #111;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }

        .product-sticker-title {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .product-sticker-subtitle {
          font-size: 10px;
          color: #555;
          margin-top: 2px;
        }

        .product-sticker-order {
          text-align: right;
          font-size: 11px;
          line-height: 1.5;
        }

        .product-sticker-shipto {
          border: 1px solid #111;
          padding: 10px;
          margin-bottom: 10px;
        }

        .product-sticker-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 4px;
        }

        .product-sticker-name {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.3;
        }

        .product-sticker-address {
          margin-top: 4px;
          font-size: 12px;
          line-height: 1.45;
        }

        .product-summary-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px 12px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }

        .product-summary-item {
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }

        .product-summary-item:last-child,
        .product-summary-qty:last-child {
          border-bottom: none;
        }

        .product-summary-name {
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
        }

        .product-summary-sku {
          font-size: 10px;
          font-family: monospace;
          color: #666;
          margin-top: 2px;
        }

        .product-summary-qty {
          min-width: 52px;
          text-align: right;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
          font-weight: 900;
        }

        .product-sticker-footer {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 2px solid #111;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
        }

        .product-sticker-footer span:last-child {
          text-align: right;
        }

        @media print {
          body { background: #fff; }
          .toolbar { display: none !important; }
          .page-wrap { padding: 0; }
          .doc { box-shadow: none; margin: 0 auto; }

          .doc-paper {
            width: 4in;
          }

          .doc-paper .thermal-shell,
          .doc-paper .product-sticker {
            display: none !important;
          }

          .doc-paper .paper-label-page {
            width: 4in;
            min-height: 6in;
            height: 6in;
            page-break-before: always;
          }

          .doc-paper .paper-label-panel {
            width: 4in;
            min-height: 6in;
            height: 6in;
          }

          .doc-paper .paper-label-rotated {
            width: 6in;
            height: 4in;
            transform: translateY(0.28in) rotate(90deg) scale(1.04);
          }

          .doc-paper .paper-label-rotated img {
            width: 6in;
            height: 4in;
            object-fit: contain;
          }

          .doc-thermal-label,
          .doc-thermal-products {
            width: 4in;
          }

          .doc-thermal-label .slip,
          .doc-thermal-label .cut-line,
          .doc-thermal-label .product-sticker,
          .doc-thermal-products .slip,
          .doc-thermal-products .cut-line {
            display: none !important;
          }

          .doc-thermal-label .thermal-shell,
          .doc-thermal-products .thermal-shell {
            padding: 0;
          }

          .doc-thermal-label .thermal-pages,
          .doc-thermal-products .thermal-pages {
            gap: 0;
          }

          .doc-thermal-label .thermal-note,
          .doc-thermal-products .thermal-note {
            display: none !important;
          }

          .doc-thermal-label .thermal-page,
          .doc-thermal-products .thermal-page {
            width: 4in;
            min-height: 6in;
            height: 6in;
            border: none;
            page-break-after: always;
          }

          .doc-thermal-label .thermal-page:last-child,
          .doc-thermal-products .thermal-page:last-child {
            page-break-after: auto;
          }

          .doc-thermal-label .thermal-label-panel,
          .doc-thermal-products .thermal-label-panel,
          .doc-thermal-products .product-sticker {
            border: none;
            margin: 0;
          }

          .doc-thermal-label .thermal-label-panel,
          .doc-thermal-products .thermal-label-panel {
            width: 4in;
            min-height: 6in;
            height: 6in;
          }

          .doc-thermal-label .thermal-label-rotated,
          .doc-thermal-products .thermal-label-rotated {
            width: 6in;
            height: 4in;
          }

          .doc-thermal-label .thermal-label-rotated img,
          .doc-thermal-products .thermal-label-rotated img {
            width: 6in;
            height: 4in;
            object-fit: contain;
          }

          .doc-thermal-products .product-sticker {
            page-break-before: always;
          }

          .doc-thermal-products .product-summary-item,
          .doc-thermal-products .product-summary-qty {
            break-inside: avoid;
          }

          @page {
            size: ${printPageSize};
            margin: 0;
          }
        }
      `}</style>

      <div className="toolbar">
        <div className="toolbar-title">
          {label.is_return ? 'Return' : 'Shipment'} #{label.shipment_id}
          <small>Order #{label.order_number || label.order_id}</small>
        </div>

        <div className="toolbar-controls">
          <select
            className="mode-select"
            value={printMode}
            onChange={(event) => handleModeChange(event.target.value as PrintMode)}
          >
            {PRINT_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button className="tbtn tbtn-print" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </button>
          <button className="tbtn tbtn-close" onClick={() => window.close()}>
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>

      <div className="page-wrap">
        <div className={docClassName}>
          {printMode === 'paper' && (
            <>
              <div className="slip">
                <div className="slip-header">
                  <div>
                    <div className="slip-co-name">{label.company.name}</div>
                    <div className="slip-co-web">{label.company.website}</div>
                  </div>
                  <div className="slip-meta">
                    <div className="slip-meta-title">
                      {label.is_return ? 'Return Slip' : 'Packing Slip'}
                    </div>
                    <div className="slip-meta-sub">Order #{label.order_number || label.order_id}</div>
                    <div className="slip-meta-sub">{date}</div>
                    <div
                      className="slip-meta-sub"
                      style={{ fontFamily: 'monospace', fontSize: '9px' }}
                    >
                      {label.tracking_number}
                    </div>
                  </div>
                </div>

                <div className="slip-divider" />
          {/* ════ PACKING SLIP ════ */}

                <div className="addresses">
                  <div className="addr-block">
                    <div className="addr-label">Ship To</div>
                    <div className="addr-name">{label.ship_to.name}</div>
                    <div className="addr-line">
                      {label.ship_to.address}
                      <br />
                      {label.ship_to.city}, {label.ship_to.state} {label.ship_to.zip}
                      <br />
                      {label.ship_to.country}
                      {label.ship_to.phone && (
                        <>
                          <br />
                          {label.ship_to.phone}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="addr-block">
                    <div className="addr-label">Ship From</div>
                    <div className="addr-name">{label.ship_from.name}</div>
                    <div className="addr-line">
                      {label.ship_from.address}
                      <br />
                      {label.ship_from.city}, {label.ship_from.state} {label.ship_from.zip}
                      {label.ship_from.phone && (
                        <>
                          <br />
                          {label.ship_from.phone}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="slip-divider" />

                <table className="items-table">
                  <thead>
                    <tr>
                      <td>Item / SKU</td>
                      <td>Qty</td>
                    </tr>
                  </thead>
                  <tbody>
                    {label.items.map((item, index) => (
                      <tr key={`${item.product_sku}-${index}`}>
                        <td>
                          <div className="item-name">{item.product_name}</div>
                          <div className="item-sku">SKU: {item.product_sku}</div>
                        </td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {label.is_return && label.return_reason && (
                  <div className="return-note">
                    <strong>Return reason:</strong> {label.return_reason}
                  </div>
                )}
              </div>

              <div className="cut-line">
                <span className="cut-text">fold here</span>
              </div>

              <div className="paper-label-page">
                <div className="paper-label-panel">
                  <div className="paper-label-rotated">
                    <img
                      src={label.label_url}
                      alt="UPS Shipping Label"
                      onLoad={() => setLabelImageLoaded(true)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {printMode !== 'paper' && (
            <div className="thermal-shell">
              <div className="thermal-note">
                {printMode === 'thermal-label'
                  ? 'Use this mode for a standard 4x6 UPS sticker label printer.'
                  : 'This mode prints the UPS sticker first, then a separate product-information sticker for packing or warehouse use.'}
              </div>

              <div className="thermal-pages">
                <div className="thermal-page">
                  <div className="thermal-label-panel">
                    <div className="thermal-label-rotated">
                      <img
                        src={label.label_url}
                        alt="UPS thermal shipping label"
                        onLoad={() => setLabelImageLoaded(true)}
                      />
                    </div>
                  </div>
                </div>

                {printMode === 'thermal-products' && (
                  <div className="thermal-page">
                    <div className="product-sticker">
                      <div className="product-sticker-header">
                        <div>
                          <div className="product-sticker-title">Product Sticker</div>
                          <div className="product-sticker-subtitle">{label.company.name}</div>
                        </div>
                        <div className="product-sticker-order">
                          <div>{label.order_number}</div>
                          <div>{date}</div>
                          <div>{label.tracking_number}</div>
                        </div>
                      </div>

                      <div className="product-sticker-shipto">
                        <div className="product-sticker-label">Ship To</div>
                        <div className="product-sticker-name">{label.ship_to.name}</div>
                        <div className="product-sticker-address">
                          {label.ship_to.address}
                          <br />
                          {label.ship_to.city}, {label.ship_to.state} {label.ship_to.zip}
                          <br />
                          {label.ship_to.country}
                        </div>
                      </div>

                      <div className="product-summary-grid">
                        {label.items.map((item, index) => (
                          <React.Fragment key={`${item.product_sku}-${index}-summary`}>
                            <div className="product-summary-item">
                              <div className="product-summary-name">{item.product_name}</div>
                              <div className="product-summary-sku">SKU: {item.product_sku}</div>
                            </div>
                            <div className="product-summary-qty">QTY {item.quantity}</div>
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="product-sticker-footer">
                        <span>{totalItems} total item(s)</span>
                        <span>${label.total}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
