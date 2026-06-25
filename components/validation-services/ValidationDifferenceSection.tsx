import { Check } from "lucide-react";
import { ReactNode } from "react";

type Card = {
  index: string;
  title: string;
  className: string;
  textClass: string;
  body: ReactNode;
};

const cards: Card[] = [
  {
    index: "01",
    title: "Built Around Regulatory Expectations",
    className: "bg-[#c8eaf7]",
    textClass: "text-[#123669]",
    body: (
      <>
        <p>Many labs only discover documentation gaps when inspectors request specific studies.</p>
        <p className="mt-3 font-semibold">Our protocols and reporting templates are built explicitly with:</p>
        <div className="mt-3 flex flex-wrap gap-4 font-semibold">
          {["CLIA", "CAP", "COLA"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <Check className="h-5 w-5" />
              {item}
            </span>
          ))}
        </div>
        <p className="mt-3">The result: structured, consistent, audit-ready documentation.</p>
      </>
    ),
  },
  {
    index: "02",
    title: "Zero Net Loss Validation",
    className: "bg-[#57bcc8]",
    textClass: "text-white",
    body: (
      <>
        <p className="font-semibold">A smarter model.</p>
        <p className="mt-3 font-semibold">Zero Net Loss Validation allows labs to:</p>
        <ul className="mt-3 space-y-2">
          {[
            "Complete full assay validation",
            "Utilize additional reagents provided",
            "Test a limited number of patient samples",
            "Generate revenue to support future assay orders",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-1 h-5 w-5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">Validation becomes a strategic investment, not a sunk cost.</p>
      </>
    ),
  },
  {
    index: "03",
    title: "Structured, Efficient Workflow",
    className: "bg-[#1d2956]",
    textClass: "text-white",
    body: (
      <>
        <p className="font-semibold">Efficient workflow means:</p>
        <p className="mt-3">
          A process where everything is self-explanatory and any new person in the room can execute
          with minimal supervision.
        </p>
        <p className="mt-4 font-semibold">We design validation so execution is:</p>
        <div className="mt-3 flex flex-wrap gap-4 font-semibold">
          {["Clear", "Reproducible", "Repeatable across assays and operators"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <Check className="h-5 w-5" />
              {item}
            </span>
          ))}
        </div>
      </>
    ),
  },
];

export default function ValidationDifferenceSection() {
  return (
    <section className="bg-[#f2f4f6] py-10 [font-family:'Times_New_Roman',Times,serif]">
      <div className="mx-auto max-w-7xl rounded-2xl bg-[#dce9ef] px-4 py-10 md:px-8 md:py-12">
        <h2 className="text-center text-3xl font-semibold leading-tight text-[#123669] md:text-5xl">
          What Makes BioPathogenix Different
        </h2>

        <div className="mt-8 space-y-5">
          {cards.map((card) => (
            <div
              key={card.index}
              className={`grid gap-6 rounded-2xl px-6 py-8 md:grid-cols-[0.95fr_1.05fr] md:px-10 ${card.className} ${card.textClass}`}
            >
              <div className="flex items-center gap-5">
                <span className="text-5xl font-semibold opacity-35 md:text-7xl">{card.index}</span>
                <h3 className="text-3xl font-semibold leading-tight md:text-4xl">{card.title}</h3>
              </div>
              <div className="text-lg leading-relaxed md:text-xl">{card.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
