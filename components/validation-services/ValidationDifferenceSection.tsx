import { Check } from "lucide-react";
import styles from "./ValidationPage.module.css";
import { CheckList } from "./ValidationUi";

const standards = ["CLIA", "CAP", "COLA"];

const zeroNetLossBullets = [
  "Complete full assay validation",
  "Utilize additional reagents provided",
  "Test a limited number of patient samples",
  "Generate revenue to support future assay orders",
];

export default function ValidationDifferenceSection() {
  return (
    <section className={styles.difference}>
      <h2 className={styles.h2}>
        What Makes
        <br />
        <span>BioPathogenix</span> Different
      </h2>

      <div className={styles.cardTrack}>
        <article className={`${styles.card} ${styles.cardDark}`}>
          <p className={styles.cardNumber}>01.</p>
          <h3>Built Around Regulatory Expectations</h3>
          <p className={styles.lead}>
            Many labs only discover documentation gaps when inspectors request specific studies.
          </p>
          <div className={styles.standards}>
            <p>Our protocols and reporting templates are built explicitly with:</p>
            {standards.map((item) => (
              <span key={item} className={styles.pill}>
                <span aria-hidden="true">
                  <Check strokeWidth={3} />
                </span>
                {item}
              </span>
            ))}
          </div>
          <p className={styles.result}>
            <strong>The result:</strong> Structured, consistent, audit-ready documentation.
          </p>
        </article>

        <article className={styles.card}>
          <p className={styles.cardNumber}>02.</p>
          <h3>Zero Net Loss Validation</h3>
          <p className={`${styles.lead} ${styles.cardSub}`}>A smarter model.</p>
          <h4>Zero Net Loss Validation allows labs to:</h4>
          <CheckList items={zeroNetLossBullets} />
          <p className={styles.lead}>Validation becomes a strategic investment, not a sunk cost.</p>
        </article>
      </div>
    </section>
  );
}
