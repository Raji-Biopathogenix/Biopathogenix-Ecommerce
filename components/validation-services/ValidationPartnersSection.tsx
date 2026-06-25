import Image from "next/image";

const partners = [
  {
    name: "Venkatesh Kolluru, Ph.D.",
    role: "Field Application Manager",
    image: "/images/validation%20services/Venkatesh2.jpg",
    bg: "bg-[#bfe3ef]",
    text: "text-[#123669]",
  },
  {
    name: "Jatinder Sambi",
    role: "Field Application Specialist",
    image: "/images/validation%20services/Jatinder.jpg",
    bg: "bg-[#57bcc8]",
    text: "text-white",
  },
];

export default function ValidationPartnersSection() {
  return (
    <section className="bg-[#f2f4f6] pt-10 [font-family:'Times_New_Roman',Times,serif]">
      <div className="mx-auto max-w-7xl rounded-t-2xl bg-[#dce9ef] px-4 py-10 md:px-8">
        <h2 className="text-center text-3xl font-semibold leading-tight text-[#123669] md:text-5xl">
          Meet Your Validation Partners
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className={`grid overflow-hidden rounded-2xl md:grid-cols-[0.86fr_1.14fr] ${partner.bg}`}
            >
              <Image
                src={partner.image}
                alt={partner.name}
                width={800}
                height={700}
                className="h-full w-full object-cover"
              />
              <div className={`flex flex-col items-center justify-center px-6 py-10 text-center ${partner.text}`}>
                <h3 className="text-3xl font-semibold leading-tight md:text-4xl">{partner.name}</h3>
                <p className="mt-3 text-xl md:text-xl">{partner.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
