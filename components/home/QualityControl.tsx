import Image from "next/image";
import Link from "next/link";

export default function QualityControlSection() {
  return (
    <section className="py-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* LEFT IMAGE */}
          <div className="relative w-full">
            <Image
              src="/images/home/quality-control-1.webp"
              alt="Quality Control Lab"
              width={1024}
              height={596}
              className="rounded-[16px] w-full h-auto object-cover"
              priority
            />
          </div>

          {/* RIGHT CONTENT */}
          <div className="max-w-[420px]">
            <h2 className="text-[32px] font-semibold leading-[1.2] text-[#0b2e59] mb-6">
              Quality Control
            </h2>

            <p className="text-[16px] leading-[1.6] text-[#0b2e59] mb-10">
              At BioPathogenix, we adhere to stringent quality control processes,
              ensuring that our lab supplies meet the highest standards of
              accuracy and reliability.
            </p>

            <Link
              href="/product-category/quality-control/"
              className="inline-flex items-center gap-3 bg-[#0b76d1] text-white text-[14px] font-medium px-6 py-3 rounded-lg hover:bg-[#095fa8] transition"
            >
              Learn More <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
