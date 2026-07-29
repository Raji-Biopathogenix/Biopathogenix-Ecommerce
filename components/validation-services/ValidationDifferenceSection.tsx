import { Check } from "lucide-react";
import { ReactNode } from "react";

type Card = {
  index: string;
  title: string;
  className: string;
  textClass: string;
  indexClass: string;
  body: ReactNode;
};

const cards: Card[] = [
  {
    index: "01.",
    title: "Built Around Regulatory Expectations",
    className: "bg-[#0f2a4d]",
    textClass: "text-white",
    indexClass: "text-[#5fb8dd]",
    body: (
      <>
        <p>Many labs only discover documentation gaps when inspectors request specific studies.</p>
        <p className="mt-4 font-semibold">Our protocols and reporting templates are built explicitly with:</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
          {["CLIA", "CAP", "COLA"].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"
            >
              <Check className="h-4 w-4 text-[#5fb8dd]" />
              {item}
            </span>
          ))}
        </div>
        <div className="mt-5 rounded-lg border-l-4 border-[#5fb8dd] bg-white px-4 py-3 text-sm text-[#123669]">
          <span className="font-semibold">The result:</span> Structured, consistent, audit-ready
          documentation.
        </div>
      </>
    ),
  },
  {
    index: "02.",
    title: "Zero Net Loss Validation",
    className: "bg-white",
    textClass: "text-[#123669]",
    indexClass: "text-[#3d7ec2]",
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
              <Check className="mt-1 h-4 w-4 shrink-0 text-[#3d7ec2]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">Validation becomes a strategic investment, not a sunk cost.</p>
      </>
    ),
  },
  {
    index: "03.",
    title: "Structured, Efficient Workflow",
    className: "bg-[#57bcc8]",
    textClass: "text-white",
    indexClass: "text-white/70",
    body: (
      <>
        <p className="font-semibold">Efficient workflow means:</p>
        <p className="mt-3">
          A process where everything is self-explanatory and any new person in the room can execute
          with minimal supervision.
        </p>
        <p className="mt-4 font-semibold">We design validation so execution is:</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
          {["Clear", "Reproducible", "Repeatable across assays and operators"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
              <Check className="h-4 w-4" />
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
    <section className="bg-[#f2f4f6] py-10 md:py-16">
      <div className="mx-auto max-w-7xl rounded-2xl bg-[#dce9ef] px-4 py-10 md:px-8 md:py-14">
        <h2 className="text-center font-['Quicksand'] text-3xl font-bold leading-tight text-[#123669] md:text-5xl">
          What Makes <span className="text-[#3d7ec2]">BioPathogenix</span> Different
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.index}
              className={`flex flex-col rounded-2xl px-6 py-8 shadow-sm ${card.className} ${card.textClass}`}
            >
              <span className={`text-sm font-bold ${card.indexClass}`}>{card.index}</span>
              <h3 className="mt-2 font-['Quicksand'] text-2xl font-bold leading-tight">{card.title}</h3>
              <div className="mt-5 flex-1 text-sm leading-relaxed">{card.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
