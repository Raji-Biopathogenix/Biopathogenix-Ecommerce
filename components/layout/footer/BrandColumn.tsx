import Logo from "../header/Logo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";

export default function BrandColumn() {
    return (
        <div className="max-w-[320px]">
            <div className="mb-4">
                <Logo />
            </div>

            <p className="mb-8 text-[16px] leading-[1.75] text-[#51647c]">
                Based in Nicholasville, KY, BioPathogenix provides laboratories with
                quality wholesale supplies for qPCR and validation workflows.
            </p>

            <a
                href="https://www.linkedin.com/company/biopathogenix"
                target="_blank"
                className="inline-flex items-center gap-3 text-[13px] font-bold tracking-[0.12em] text-[#10264a] transition hover:text-[#4f87cb]"
            >
                <FontAwesomeIcon
                    icon={faLinkedinIn}
                    className="text-[#4f87cb] text-[18px]"
                />

                FOLLOW US ON LINKEDIN
            </a>
        </div>
    );
}
