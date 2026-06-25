import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  // Order statuses
  pending:             { bg: 'bg-gray-100',    text: 'text-gray-600',   label: 'Pending'             },
  confirmed:           { bg: 'bg-blue-100',    text: 'text-blue-700',   label: 'Confirmed'           },
  processing:          { bg: 'bg-indigo-100',  text: 'text-indigo-700', label: 'Processing'          },
  partially_shipped:   { bg: 'bg-cyan-100',    text: 'text-cyan-700',   label: 'Partially shipped'   },
  shipped:             { bg: 'bg-blue-100',    text: 'text-blue-700',   label: 'Shipped'             },
  partially_delivered: { bg: 'bg-amber-100',   text: 'text-amber-700',  label: 'Partially delivered' },
  delivered:           { bg: 'bg-green-100',   text: 'text-green-700',  label: 'Delivered'           },
  return_requested:    { bg: 'bg-orange-100',  text: 'text-orange-700', label: 'Return requested'    },
  partially_returned:  { bg: 'bg-orange-100',  text: 'text-orange-700', label: 'Partially returned'  },
  returned:            { bg: 'bg-orange-100',  text: 'text-orange-700', label: 'Returned'            },
  completed:           { bg: 'bg-green-100',   text: 'text-green-700',  label: 'Completed'           },
  cancelled:           { bg: 'bg-red-100',     text: 'text-red-700',    label: 'Cancelled'           },
  refunded:            { bg: 'bg-purple-100',  text: 'text-purple-700', label: 'Refunded'            },
  // Shipment statuses
  label_created:       { bg: 'bg-blue-100',    text: 'text-blue-700',   label: 'Label created'       },
  picked_up:           { bg: 'bg-indigo-100',  text: 'text-indigo-700', label: 'Picked up'           },
  in_transit:          { bg: 'bg-purple-100',  text: 'text-purple-700', label: 'In transit'          },
  // item statuses
  unshipped:           { bg: 'bg-gray-100',    text: 'text-gray-500',   label: 'Unshipped'           },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = CONFIG[status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: status };
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
