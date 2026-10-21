import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhoneAlt,
  faEnvelope,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FOOTER_HEADING, FOOTER_LINK, FOOTER_LIST } from "./footerStyles";

// Icons sit in a 16px column, 12px before the text, on each item's first line.
const ICON = "w-4 shrink-0 text-center text-[#3e97ce]";

export default function FooterContact() {
  return (
    <div>
      <h4 className={FOOTER_HEADING}>
        Contact
      </h4>

      <ul className={FOOTER_LIST}>
        {/* Phone */}
        <li>
          <a href="tel:(859)444-5660" className={`flex items-start gap-3 ${FOOTER_LINK}`}>
            <span className={ICON}>
              <FontAwesomeIcon icon={faPhoneAlt} flip="horizontal" />
            </span>
            <span>(859) 444-5660</span>
          </a>
        </li>

        {/* Email */}
        <li>
          <a href="mailto:order@biopathogenix.com" className={`flex items-start gap-3 ${FOOTER_LINK}`}>
            <span className={ICON}>
              <FontAwesomeIcon icon={faEnvelope} />
            </span>
            <span>order@biopathogenix.com</span>
          </a>
        </li>

        {/* Address */}
        <li>
          <a
            href="https://maps.app.goo.gl/Uz7FhqXWEMZWCSkK6"
            target="_blank"
            className={`flex items-start gap-3 ${FOOTER_LINK}`}
          >
            <span className={ICON}>
              <FontAwesomeIcon icon={faMapMarkerAlt} />
            </span>
            <span>
              3004 Park Central Ave
              <br />
              Nicholasville, KY 40356
            </span>
          </a>
        </li>
      </ul>
    </div>
  );
}
