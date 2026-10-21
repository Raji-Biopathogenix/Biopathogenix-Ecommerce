import Link from "next/link";
import { FOOTER_HEADING, FOOTER_LINK, FOOTER_LIST } from "./footerStyles";

const projects = [
  { label: "Bacterium is Beautiful", href: "https://www.bacteriumisbeautiful.com/" },
  { label: "LinkedIn Circle", href: "https://www.linkedin.com/groups/14778657/" },
];

export default function ProjectsColumn() {
  return (
    <div>
      <h4 className={FOOTER_HEADING}>
        Projects
      </h4>

      <ul className={FOOTER_LIST}>
        {projects.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className={FOOTER_LINK}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
