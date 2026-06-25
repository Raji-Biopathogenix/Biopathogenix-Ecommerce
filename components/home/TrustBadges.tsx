import Image from "next/image";

const badges = [
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

export default function TrustBadges() {
  return (
    <section className="max-w-[1400px] mx-auto px-6 py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {badges.map((b) => (
          <div
            key={b.text}
            className="rounded-[24px] border-2 border-[#d9ecfb] bg-white px-10 text-center flex flex-col items-center justify-center min-h-[240px]"
          >
            {/* Icon Bubble */}
            <div className="flex items-center justify-center rounded-full mb-8">
              <Image src={b.img} alt="" width={70} height={81} />
            </div>

            {/* Text */}
            <p className="text-[16px] leading-[1.6] text-[#0b2e59]">
              {b.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
