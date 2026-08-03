import Link from "next/link";

const projects = [
  { label: "AI x Science", href: "#" },
  { label: "Bacterium is Beautiful", href: "https://www.bacteriumisbeautiful.com/" },
  { label: "Event Series", href: "#" },
  { label: "LinkedIn Circle", href: "https://www.linkedin.com/groups/14778657/" },
];

export default function ProjectsColumn() {
  return (
    <div>
      <h4 className="mb-6 text-[18px] font-bold text-[#10264a]">
        Projects
      </h4>

      <ul className="space-y-4">
        {projects.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-[16px] text-[#51647c] transition hover:text-[#4f87cb]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
