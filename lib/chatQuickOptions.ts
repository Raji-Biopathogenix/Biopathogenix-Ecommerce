// chatQuickOptions.ts
export type QuickOption = {
  key: string;
  label: string;
  href: string;
};

export const QUICK_OPTIONS: QuickOption[] = [
  {
  key: "extraction-sample-prep",
  label: "Extraction & Sample Prep ",
  href: "/product/extraction-sample-prep",
  },

  {
    key: "qplex-pcr-assays",
    label: "qPLEX PCR Assays",
    href: "/product/qplex-pcr-assays",
  },
  {
    key: "specimen-collection-supplies",
    label: "Consumables & Lab Supplies",
    href: "/product/specimen-collection-supplies",
  },
  {
    key: "ppe",
    label: "Personal Protection Equipment",
    href: "/product/ppe",
  },
  {
    key: "new-arrivals",
    label: "New Arrivals",
    href: "/product/new-arrivals",
  },
];