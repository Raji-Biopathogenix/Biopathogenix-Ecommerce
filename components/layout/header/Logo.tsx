import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 navbar__logo">
      <Image
        src="/images/logo/BioPathogenix-Horizontal-1.svg"
        alt="BioPathogenix"
        width={180}
        height={42}
        priority
        className="h-8 md:h-12 w-auto"
      />
    </Link>
  )
}
