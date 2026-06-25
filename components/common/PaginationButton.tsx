import Link from "next/link";


export default function PaginationButton({
  href,
  disabled,
  children,
  onClick,
}: {
  href: string
  disabled: boolean
  children: React.ReactNode
onClick?: () => void
}) {
  if (disabled) {
    return (
      <span className="px-3 py-1 border rounded text-sm text-gray-300 cursor-not-allowed">
        {children}
      </span>
    )
  }
  return (
    <Link
      href={href}
      className="px-3 py-1 border rounded text-sm hover:bg-gray-100 text-gray-700"
    >
      {children}
    </Link>
  )
}