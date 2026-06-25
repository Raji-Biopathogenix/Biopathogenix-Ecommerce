import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhoneAlt,
  faEnvelope,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function FooterContact() {
  return (
    <div>
      <h4 className="text-[18px] font-semibold text-[#0b2e59] mb-6">
        Contact
      </h4>

      <ul className="space-y-4">
        {/* Phone */}
        <li>
          <a
            href="tel:(859)444-5660"
            className="flex items-center gap-3 text-[16px] text-[#0b2e59] hover:text-[#0b76d1] transition"
          >
            <span className="text-[#0b76d1] text-[16px]">
              <FontAwesomeIcon icon={faPhoneAlt} flip="horizontal" />
            </span>
            <span>(859) 444-5660</span>
          </a>
        </li>

        {/* Email */}
        <li>
          <a
            href="mailto:order@biopathogenix.com"
            className="flex items-center gap-3 text-[16px] text-[#0b2e59] hover:text-[#0b76d1] transition"
          >
            <span className="text-[#0b76d1] text-[16px]">
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
            className="flex items-start gap-3 text-[16px] text-[#0b2e59] hover:text-[#0b76d1] transition leading-[1.6]"
          >
            <span className="text-[#0b76d1] text-[16px] mt-[2px]">
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
