import Image from "next/image";
import Link from "next/link";

const cards = [
  {
    title: "Split Sample Testing",
    description:
      "Compare your results with the results of other laboratories by testing the same sample, verifying the accuracy of your tests.",
    image: "/images/quality-control/Split-Sample-Testing.jpg",
    linkText: "Learn More",
    link: "/split-sample-testing",
  },
  {
    title: "BioBank/Contrived Samples",
    description:
      "A control designed to assess the performance of downstream molecular assays.",
    image: "/images/quality-control/Contrived-Sample.jpg",
    linkText: "Shop Now",
    link: "/contrived-samples",
  },
  {
    title: "Quality Control and Validation kits",
    description:
      "Designed to monitor the efficiency and consistency of RNA/DNA extraction from various sample types.",
    image: "/images/quality-control/BPX-Extraction-Controls.jpg",
    linkText: "Shop Now",
    link: "/quality-control-and-validation-kits",
  },
];

export default function QualityControlPage() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* TITLE */}
        <h1 className="text-center text-[34px] md:text-[42px] font-semibold text-[#062a4d] mb-14">
          Quality Control
        </h1>

        {/* GRID */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-[22px] overflow-hidden bg-[#f3f8fb] flex flex-col hover:shadow-lg transition"
            >
              {/* IMAGE */}
              <div className="relative h-[240px]">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* CONTENT */}
              <div className="flex flex-col flex-1 px-7 py-8">
                <h3 className="text-[22px] font-semibold text-[#062a4d] mb-3 leading-snug">
                  {card.title}
                </h3>

                <p className="text-[18px] text-[#2c3e50] leading-relaxed mb-6">
                  {card.description}
                </p>

                <Link
                  href={card.link}
                  className="mt-auto inline-block text-[15px] font-medium text-[#0a73d8] underline underline-offset-4 hover:text-[#084f9d] transition"
                >
                  {card.linkText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
