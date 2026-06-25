import Image from "next/image";
import Link from "next/link";

const trustBadges = [
  {
    img: "/images/home/trust-badge/fast-shipping.svg",
    text: "Timely shipping: Standard kits ship within 24 hours, Custom kits within 72 hours",
  },
  {
    img: "/images/home/trust-badge/no-contracts.svg",
    text: "No contractual requirements and no minimum order requirements",
  },
  {
    img: "/images/home/trust-badge/quick-customer-service.svg",
    text: "Rapid response to customer inquiries.",
  },
];

export default function AboutPage() {
  return (
    <main className="w-full">

      {/* ================= HERO SECTION ================= */}
      <section
        className="relative bg-cover bg-center py-16"
        style={{
    backgroundImage: "url(/images/about/background-image.webp)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  }}

      >
        <div className="relative max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#003B5C]">
            About BioPathogenix
          </h1>

          <p className="text-gray-600 mt-2 mb-10">
            Providing Turnkey Solutions for Laboratories
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {trustBadges.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-5"
              >
                <Image
                  src={item.img}
                  alt="icon"
                  width={60}
                  height={60}
                />
                <p className="text-sm text-gray-700 leading-snug">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WELCOME SECTION ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">

          {/* Image */}
          <div className="rounded-xl overflow-hidden shadow-md">
            <Image
              src="/images/about/Welcome-to-BioPathogenix.webp"
              alt="Welcome"
              width={640}
              height={480}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Content */}
          <div>
            <h2 className="text-3xl font-semibold text-[#003B5C] mb-4">
              Welcome to BioPathogenix
            </h2>

            <p className="text-gray-700 leading-relaxed mb-6">
              At BioPathogenix, we are dedicated to advancing the field of molecular
              workflows by providing high-quality lab supplies and innovative
              solutions to laboratories worldwide. Established in 2020 and
              headquartered in Nicholasville, Kentucky, BioPathogenix has quickly
              become a trusted partner for research and clinical laboratories.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#003B5C] text-white px-6 py-3 rounded-md hover:bg-[#022c44] transition"
            >
              Contact Us →
            </Link>
          </div>
        </div>
      </section>

      {/* ================= MISSION SECTION ================= */}
<section
  className="relative w-full overflow-hidden bg-cover bg-center flex items-center justify-center"
  style={{
    backgroundImage: "url(/images/about/Our-Mission-Background.jpg)",
    minHeight: "620px",
  }}
>
  {/* CONTENT */}
  <div className="relative z-10 max-w-3xl px-6 text-center flex flex-col items-center">

    <Image
      src="/images/about/BioPathogenix-Icon.svg"
      alt="icon"
      width={64}
      height={64}
      className="mb-4"
    />

    <h2 className="text-[42px] font-semibold text-[#003B5C] mb-4">
      Our Mission
    </h2>

    <p className="max-w-[720px] text-[17px] leading-[28px] text-[#2f3a44]">
      Founded on the principles of precision and reliability, our mission is to ensure that
      every product meets the highest standards of quality. Our team is composed of experts
      who are dedicated to maintaining stringent quality control, developing innovative
      solutions, and providing personalized technical support.
    </p>
  </div>

  {/* LEFT BIG */}
  <Image
    src="/images/about/Molecular-Diagnostics.webp"
    alt=""
    width={192}
    height={214}
    className="hidden lg:block absolute left-[6%] top-[10%]"
  />

  {/* LEFT SMALL */}
  <Image
    src="/images/about/Protective-Equipment.webp"
    alt=""
    width={120}
    height={134}
    className="hidden lg:block absolute left-[12%] bottom-[14%]"
  />

  {/* RIGHT SMALL */}
  <Image
    src="/images/about/Microscope.webp"
    alt=""
    width={120}
    height={134}
    className="hidden lg:block absolute right-[12%] top-[14%]"
  />

  {/* RIGHT BIG */}
  <Image
    src="/images/about/Disease-Testing.webp"
    alt=""
    width={192}
    height={214}
    className="hidden lg:block absolute right-[6%] bottom-[10%]"
  />
</section>




      {/* ================= QUALITY SECTION ================= */}
      <section className="bg-[#062f4f] text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2">

          {/* Image */}
          <div className="relative h-[420px] lg:h-auto">
            <Image
              src="/images/about/Quality-and-Innovation.webp"
              alt="Quality"
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center" style={{padding: "60px 88px 60px 44px"}}>
            <h2 className="text-3xl font-semibold mb-4">
              Quality and Innovation
            </h2>

            <p className="text-white/80 leading-relaxed mb-6">
              Quality is at the heart of everything we do. BioPathogenix is committed
              to continuous innovation and rigorous quality control to deliver
              products that meet the highest industry standards. Our dedication to
              excellence ensures that our customers can rely on us for dependable and
              effective laboratory solutions.
            </p>

            <Link
              href="/quality-control"
              className="inline-flex items-center gap-2 bg-white text-[#062f4f] px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition w-fit"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
