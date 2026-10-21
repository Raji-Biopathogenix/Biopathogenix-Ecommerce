import Link from "next/link";
import { FOOTER_HEADING, FOOTER_LINK, FOOTER_LIST } from "./footerStyles";

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
      <h4 className={FOOTER_HEADING}>
        Helpful Links
      </h4>

      <ul className={FOOTER_LIST}>
        {links.map((item) => (
          <li key={item.label}>
            {/* From 1280px the column is as wide as its longest link, so each stays on one line. */}
            <Link href={item.href} className={`${FOOTER_LINK} xl:whitespace-nowrap`}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
