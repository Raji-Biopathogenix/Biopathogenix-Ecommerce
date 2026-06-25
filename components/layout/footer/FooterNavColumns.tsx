import Link from "next/link";

import { fetchNavigationMenu } from "@/lib/navigation";

const FOOTER_GROUP_ORDER = ["services", "resources", "about"];

export default async function FooterNavColumns() {
  const groups = await fetchNavigationMenu();
  const orderedGroups = FOOTER_GROUP_ORDER
    .map((slug) => groups.find((group) => group.slug === slug))
    .filter((group): group is (typeof groups)[number] => Boolean(group));

  return (
    <>
      {orderedGroups.map((group) => (
        <div key={group.slug}>
          <h4 className="text-[18px] font-semibold text-[#0b2e59] mb-6">
            {group.title}
          </h4>

          <ul className="space-y-4">
            {group.items.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.url}
                  target={item.open_in_new_tab ? "_blank" : undefined}
                  rel={item.open_in_new_tab ? "noreferrer" : undefined}
                  className="text-[16px] text-[#0b2e59] hover:text-[#0b76d1] transition"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
