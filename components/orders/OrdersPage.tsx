import { useState } from "react";
import { useRouter,usePathname, useSearchParams } from "next/navigation"

const STATUS_OPTIONS = [
  "pending","confirmed","processing","shipped","delivered","cancelled","refunded",
];

const RETURN_STATUS_OPTIONS = [
  "return_requested", "return_approved", "return_rejected"
];

const PAYMENT_METHODS = ["card", "invoice"];

const RETURN_LABEL: Record<string, string> = {
  return_requested : "Return requested",
  return_approved  : "Return approved",
  return_rejected  : "Return rejected",
};

interface Filters {
  fromDate: string;
  toDate: string;
  orderId: string;
  statuses: string[];
  paymentMethods: string[];
  return_status: string[];
}

const defaultFilters: Filters = {
  fromDate: "",
  toDate: "",
  orderId: "",
  statuses: [],
  paymentMethods: [],
  return_status: [],

};

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function OrdersPage({page,from_date,to_date,order_id,statuses,paymentMethods,return_status}:{page:string,  from_date: string,
  to_date: string,order_id: string,statuses: string[],paymentMethods: string[],return_status: string[]}) {

  // console.log("===>",page,"fd==>",from_date,"td==>",to_date,"od==>",order_id,"s-->",statuses,"pm-->",paymentMethods)
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [filters, setFilters]       = useState<Filters>({
  fromDate: from_date,
  toDate: to_date,
  orderId: order_id,
  statuses:statuses,
  paymentMethods: paymentMethods,
  return_status:return_status
});
  const [applied, setApplied]       = useState<Filters>({
  fromDate: from_date,
  toDate: to_date,
  orderId: order_id,
  statuses: statuses,
  paymentMethods: paymentMethods,
  return_status:return_status
});
  const [statusOpen, setStatusOpen] = useState<boolean>(false);
  const [returnstatusOpen, setReturnStatusOpen] = useState<boolean>(false);

  const pathname = usePathname()    
  const router = useRouter()


  const hasActive =
    applied.fromDate ||
    applied.toDate ||
    applied.orderId ||
    applied.statuses.length > 0 ||
    applied.paymentMethods.length > 0;

  const toggleStatus = (val: string) =>
    setFilters((f) => ({
      ...f,
      statuses: f.statuses.includes(val)
        ? f.statuses.filter((s) => s !== val)
        : [...f.statuses, val],
    }));

  const toggleReturnStatus = (val: string) =>
  setFilters((f) => ({
    ...f,
    return_status: f.return_status.includes(val)
      ? f.return_status.filter((s) => s !== val)
      : [...f.return_status, val],
  }));

  const togglePM = (val: string) =>
    setFilters((f) => ({
      ...f,
      paymentMethods: f.paymentMethods.includes(val)
        ? f.paymentMethods.filter((m) => m !== val)
        : [...f.paymentMethods, val],
    }));

  const handleReset = () => {
    setFilters(defaultFilters);
    setApplied(defaultFilters);
    setStatusOpen(false);
    setReturnStatusOpen(false)
    router.push(`${pathname}`)
    // fetchOrders(defaultFilters);
  };


  const handleApply = () => {
    const params = new URLSearchParams();
    if(Number(page) > 1) params.set('page',page);
    if (filters?.fromDate) params.set('from_date', filters?.fromDate);
    if (filters?.toDate) params.set('to_date', filters?.toDate);
    if (filters?.orderId) params.set('order_id', filters?.orderId);
    if (filters?.statuses?.length > 0) params.set('status', (filters?.statuses).join(', '));
    if (filters?.paymentMethods?.length > 0) params.set('payment_method', (filters?.paymentMethods).join(', '));
    if (filters?.return_status?.length > 0) params.set('return_status', (filters?.return_status).join(', '));

    console.log("filters",filters)
    setApplied(filters);
    setShowFilter(false);
    setStatusOpen(false);
    setReturnStatusOpen(false)
    router.push(`${pathname}?${params.toString()}`);

    // fetchOrders(filters);
  };

  return (
    <div className="p-6">

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-medium">All orders</h1>
          <button
            onClick={() => setShowFilter((o) => !o)}
            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all
              ${showFilter
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
          >
            <FilterIcon />
            {showFilter ? "Hide filters" : "Show filters"}
            {hasActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>
        </div>

        {hasActive && (
          <button
            onClick={handleReset}
            className="text-xs text-red-500 hover:opacity-75"
          >
            ↺ Reset filters
          </button>
        )}
      </div>

      {showFilter && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 block">
                From date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, fromDate: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 block">
                To date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, toDate: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 block">
                Order ID
              </label>
              <input
                type="text"
                value={filters.orderId}
                placeholder="e.g. 41"
                onChange={(e) =>
                  setFilters((f) => ({ ...f, orderId: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 block">
                Payment method
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => togglePM(m)}
                    className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-all
                      ${filters.paymentMethods.includes(m)
                        ? "bg-blue-50 text-blue-700 border-blue-200 font-medium"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 block">
                    Status
                  </label>
                  <div
                    className="border border-gray-200 rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer"
                    onClick={() => setStatusOpen((o) => !o)}
                  >
                    <span className="text-sm text-gray-400">
                      {filters.statuses.length ? `${filters.statuses.length} selected` : "Select statuses..."}
                    </span>
                    <span className="text-xs text-gray-400">{statusOpen ? "▴" : "▾"}</span>
                  </div>

                  {statusOpen && (
                    <div className="border border-gray-200 rounded-lg mt-1">
                      {STATUS_OPTIONS.map((s) => (
                        <label key={s} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 capitalize">
                          <input
                            type="checkbox"
                            checked={filters.statuses.includes(s)}     
                            onChange={() => toggleStatus(s)}            
                            className="accent-blue-500"
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  )}

                  {filters.statuses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {filters.statuses.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                          {s}
                          <span onClick={() => toggleStatus(s)} className="cursor-pointer opacity-60 hover:opacity-100">  
                            &#x2715;
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 block">
                Return status
              </label>
              <div
                className="border border-gray-200 rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer"
                onClick={() => setReturnStatusOpen((o) => !o)}
              >
                <span className="text-sm text-gray-400">
                  {filters.return_status.length ? `${filters.return_status.length} selected` : "Select return statuses..."}
                </span>
                <span className="text-xs text-gray-400">{returnstatusOpen ? "▴" : "▾"}</span>
              </div>

              {returnstatusOpen && (
                <div className="border border-gray-200 rounded-lg mt-1">
                  {RETURN_STATUS_OPTIONS.map((s) => (
                    <label key={s} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={filters.return_status.includes(s)}   
                        onChange={() => toggleReturnStatus(s)}        
                        className="accent-blue-500"
                      />
                      {RETURN_LABEL[s]}
                    </label>
                  ))}
                </div>
  )}

              {filters.return_status.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {filters.return_status.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {RETURN_LABEL[s]}
                      <span onClick={() => toggleReturnStatus(s)} className="cursor-pointer opacity-60 hover:opacity-100">  {/* ✅ toggleReturnStatus */}
                        &#x2715;
                      </span>
                    </span>
                  ))}
    </div>
  )}
</div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleReset}
              className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="text-sm font-medium px-5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:opacity-90"
            >
              Apply filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
}