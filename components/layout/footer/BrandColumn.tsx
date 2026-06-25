import Logo from "../header/Logo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";

export default function BrandColumn() {
    return (
        <div className="max-w-[320px]">
            {/* Logo */}
            <div className="mb-3">
                <Logo></Logo>
            </div>

            {/* Description */}
            <p className="text-[16px] leading-[1.7] text-[#0b2e59] mb-10">
                Based in Nicholasville, KY, BioPathogenix provides laboratories with
                quality wholesale supplies for qPCR.
            </p>

            {/* LinkedIn */}
            <a
                href="https://www.linkedin.com/company/biopathogenix"
                target="_blank"
                className="inline-flex items-center gap-3 text-[14px] font-medium text-[#0b2e59] hover:text-[#0b76d1] transition"
            >
                <FontAwesomeIcon
                    icon={faLinkedinIn}
                    className="text-[#0b76d1] text-[18px]"
                />

                FOLLOW US ON LINKEDIN
            </a>
        </div>
    );
}
