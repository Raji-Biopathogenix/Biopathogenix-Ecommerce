import Image from "next/image";

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

const MOLECULE_PATTERN_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'%3E%3Cg fill='none' stroke='%23c3ddf0' stroke-width='1.5'%3E%3Cline x1='40' y1='60' x2='150' y2='120'/%3E%3Cline x1='150' y1='120' x2='260' y2='70'/%3E%3Cline x1='150' y1='120' x2='110' y2='250'/%3E%3Cline x1='260' y1='70' x2='340' y2='150'/%3E%3Cline x1='110' y1='250' x2='220' y2='320'/%3E%3Cline x1='220' y1='320' x2='360' y2='280'/%3E%3Cline x1='340' y1='150' x2='390' y2='260'/%3E%3C/g%3E%3Cg fill='%23c3ddf0'%3E%3Ccircle cx='40' cy='60' r='5'/%3E%3Ccircle cx='150' cy='120' r='7'/%3E%3Ccircle cx='260' cy='70' r='5'/%3E%3Ccircle cx='340' cy='150' r='6'/%3E%3Ccircle cx='110' cy='250' r='6'/%3E%3Ccircle cx='220' cy='320' r='5'/%3E%3Ccircle cx='360' cy='280' r='5'/%3E%3Ccircle cx='390' cy='260' r='4'/%3E%3C/g%3E%3C/svg%3E";

const partners = [
  {
    name: "Venkatesh Kolluru, Ph.D.",
    role: "Field Application Manager",
    image: "/images/validation%20services/Venkatesh2.jpg",
  },
  {
    name: "Jatinder Sambi",
    role: "Field Application Specialist",
    image: "/images/validation%20services/Jatinder.jpg",
  },
];

export default function ValidationPartnersSection() {
  return (
    <section
      className="isolate w-full px-4 py-16 md:px-8"
      style={{
        backgroundImage: `url("${MOLECULE_PATTERN_BG}"), linear-gradient(160deg, #eef5fb 0%, #dbe9f5 100%)`,
        backgroundRepeat: "repeat, no-repeat",
        backgroundSize: "420px 420px, cover",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center font-['Quicksand'] text-3xl font-bold leading-tight text-[#123669] md:text-5xl">
          Meet Your <span className="text-[#3d7ec2]">Validation Partners</span>
        </h2>

        <div className="mt-16 flex flex-wrap items-start justify-center gap-x-20 gap-y-12 md:gap-x-28">
          {partners.map((partner) => (
            <div key={partner.name} className="flex w-[320px] flex-col items-center text-center">
              <div
                className="relative z-10 h-[370px] w-[320px] overflow-hidden bg-white p-3 shadow-[0_20px_44px_rgba(18,53,93,0.2)] transition-transform duration-300 hover:-translate-y-1"
                style={{ clipPath: HEX_CLIP }}
              >
                <div className="relative h-full w-full overflow-hidden" style={{ clipPath: HEX_CLIP }}>
                  <Image
                    src={partner.image}
                    alt={partner.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
              <div className="-mt-12 w-full rounded-2xl bg-white px-4 pb-6 pt-14 text-center shadow-[0_10px_24px_rgba(18,53,93,0.12)]">
                <h3 className="text-xl font-bold text-[#123669] md:text-2xl">{partner.name}</h3>
                <p className="mt-1 text-base text-[#4d6280]">{partner.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
