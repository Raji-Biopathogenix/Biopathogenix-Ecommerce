"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Dashboard", href: "/my-account" },
  { label: "Orders", href: "/my-account/orders" },
  { label: "Addresses", href: "/my-account/edit-address" },
  { label: "Payment Methods", href: "/my-account/payment-methods" },
  { label: "Account Details", href: "/my-account/edit-account" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {nav.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/my-account" &&
            pathname === "/my-account/dashboard");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block uppercase tracking-wide ${
              active
                ? "text-[#0B3C5D] font-semibold"
                : "text-blue-600 hover:underline"
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      <Link
        href="/logout"
        className="block uppercase tracking-wide text-blue-600 hover:underline"
      >
        Log Out
      </Link>
    </>
  );
}
