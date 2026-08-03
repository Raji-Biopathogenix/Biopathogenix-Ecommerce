import Image from "next/image";

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

const partners = [
  {
    name: "Venkatesh Kolluru, Ph.D.",
    role: "Field Application Manager",
    image: "/images/validation%20services/10.png",
  },
  {
    name: "Jatinder Sambi",
    role: "Field Application Specialist",
    image: "/images/validation%20services/11.png",
  },
  {
    name: "Norma Drew",
    role: "Field Application Specialist",
    image: "/images/validation%20services/12.png",
  },
];

function PartnerCard({
  name,
  role,
  image,
}: {
  name: string;
  role: string;
  image: string;
}) {
  return (
    <div className="flex w-[250px] flex-col items-center text-center md:w-[300px]">
      <div
        className="relative z-10 h-[250px] w-[250px] overflow-hidden bg-white p-3 shadow-[0_20px_44px_rgba(18,53,93,0.18)] md:h-[300px] md:w-[300px]"
        style={{ clipPath: HEX_CLIP }}
      >
        <div className="relative h-full w-full overflow-hidden" style={{ clipPath: HEX_CLIP }}>
          <Image src={image} alt={name} fill className="object-cover object-center" />
        </div>
      </div>
      <div className="-mt-8 w-full px-4 pt-10">
        <h3 className="font-['Quicksand'] text-[1.05rem] font-bold leading-tight text-[#16345f] md:text-[1.25rem]">
          {name}
        </h3>
        <p className="mt-1 text-[0.72rem] text-[#5a6b81] md:text-[0.86rem]">{role}</p>
      </div>
    </div>
  );
}

export default function ValidationPartnersSection() {
  return (
    <section
      className="relative overflow-hidden px-4 py-12 md:px-6 md:py-16"
      style={{
        backgroundImage: `url("/images/validation%20services/bg2.jpeg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,248,252,0.92)_0%,rgba(244,248,252,0.78)_100%)]" />
      <div className="relative mx-auto max-w-[1440px]">
        <h2 className="text-center font-['Quicksand'] text-[2.05rem] font-bold leading-[0.98] tracking-[-0.04em] text-[#16345f] md:text-[3.45rem]">
          Meet Your <span className="text-[#3989c7]">Validation Partners</span>
        </h2>

        <div className="mt-8 flex flex-wrap items-start justify-center gap-x-8 gap-y-10 md:mt-12 md:gap-x-14 lg:gap-x-20">
          {partners.map((partner) => (
            <PartnerCard key={partner.name} {...partner} />
          ))}
        </div>
      </div>
    </section>
  );
}
