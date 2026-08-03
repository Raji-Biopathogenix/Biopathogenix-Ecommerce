import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 navbar__logo">
      <Image
        src="/images/logo/BioPathogenix-Horizontal-1.svg"
        alt="BioPathogenix"
        width={210}
        height={48}
        priority
        className="h-9 md:h-10 w-auto"
      />
    </Link>
  )
}
