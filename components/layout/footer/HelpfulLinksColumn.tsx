import Link from "next/link";

const links = [
  { label: "Account Login", href: "/my-account" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Quality Policy Statement", href: "/quality-policy-statement" },
  { label: "Terms and Conditions for Sale of Goods", href: "/terms-of-service" },
  { label: "Website Terms and Conditions", href: "/terms-and-conditions" },
  { label: "Contact Us", href: "/contact" },
];

export default function HelpfulLinksColumn() {
  return (
    <div>
      <h4 className="text-[18px] font-semibold text-[#0b2e59] mb-6">
        Helpful Links
      </h4>

      <ul className="space-y-4">
        {links.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-[16px] text-[#0b2e59] hover:text-[#0b76d1] transition"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
