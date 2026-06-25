import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="w-full"
      style={{
        backgroundImage: "url('/images/home/Hero-BG-1-scaled-1.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* BOXED CONTAINER (margin auto like Elementor) */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 items-center gap-12">
          
          {/* LEFT CONTENT */}
          <div>
            <h1 className="text-[38px] lg:text-[48px] leading-tight font-bold text-[#0b2e59] mb-6">
              High-Quality Lab Supplies For Your Research
            </h1>

            <p className="text-[#0b2e59]/80 text-base mb-8 max-w-xl">
              BioPathogenix, headquartered in Nicholasville, KY, specializes in
              providing high-quality laboratory supplies, including PCR
              reagents, DNA/RNA extraction kits, and nucleic acid detection &
              identification products.
            </p>

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#0c86d1] text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              <span>Shop Now</span>
              <span aria-hidden>→</span>
            </Link>
          </div>

          {/* RIGHT IMAGE (DESKTOP ONLY) */}
          <div className="hidden lg:flex justify-end">
            <Image
              src="/images/home/BioPathogenix-Laboratory-Supplies-1.webp"
              alt="High Quality Lab Supplies from BioPathogenix"
              width={856}
              height={688}
              className="w-full max-w-[520px] h-auto"
              priority
            />
          </div>

        </div>
      </div>
    </section>
  );
}
