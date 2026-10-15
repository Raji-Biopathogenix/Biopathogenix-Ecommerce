import styles from "./ValidationPage.module.css";
import { HexPhoto } from "./ValidationUi";

const partners = [
  {
    name: "Venkatesh Kolluru, Ph.D.",
    role: "Field Application Manager",
    image: "/images/validation%20services/partner-venkatesh.webp",
  },
  {
    name: "Jatinder Sambi",
    role: "Field Application Specialist",
    image: "/images/validation%20services/partner-jatinder.webp",
  },
  {
    name: "Norma Drew",
    role: "Field Application Specialist",
    image: "/images/validation%20services/partner-norma.webp",
  },
];

export default function ValidationPartnersSection() {
  return (
    <section className={styles.partners}>
      <div className={`${styles.dnaLayer} ${styles.dnaMirror}`} aria-hidden="true" />
      <div className={`${styles.dnaLayer} ${styles.dnaMirror}`} aria-hidden="true" />
      <h2 className={styles.h2}>
        Meet Your
        <br />
        <span>Validation Partners</span>
      </h2>

      <div className={styles.partnerGrid}>
        {partners.map((partner) => (
          <div key={partner.name} className={styles.partner}>
            <div className={styles.partnerHex}>
              <HexPhoto src={partner.image} alt={partner.name} />
            </div>
            <h3>{partner.name}</h3>
            <p>{partner.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
