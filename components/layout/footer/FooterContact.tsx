import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhoneAlt,
  faEnvelope,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function FooterContact() {
  return (
    <div>
      <h4 className="mb-6 text-[18px] font-bold text-[#10264a]">
        Contact
      </h4>

      <ul className="space-y-4">
        {/* Phone */}
        <li>
          <a
            href="tel:(859)444-5660"
            className="flex items-center gap-3 text-[16px] text-[#51647c] transition hover:text-[#4f87cb]"
          >
            <span className="text-[#4f87cb] text-[16px]">
              <FontAwesomeIcon icon={faPhoneAlt} flip="horizontal" />
            </span>
            <span>(859) 444-5660</span>
          </a>
        </li>

        {/* Email */}
        <li>
          <a
            href="mailto:order@biopathogenix.com"
            className="flex items-center gap-3 text-[16px] text-[#51647c] transition hover:text-[#4f87cb]"
          >
            <span className="text-[#4f87cb] text-[16px]">
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
            className="flex items-start gap-3 text-[16px] leading-[1.65] text-[#51647c] transition hover:text-[#4f87cb]"
          >
            <span className="mt-[2px] text-[16px] text-[#4f87cb]">
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
