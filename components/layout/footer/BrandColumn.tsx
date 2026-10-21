import Logo from "../header/Logo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";

export default function BrandColumn() {
    return (
        // Figma: the logo starts 5px above the column headings, so the copy below it
        // starts on the same line as each column's first item.
        <div className="max-w-[325px] lg:-mt-[5px]">
            <div className="mb-[15px]">
                <Logo />
            </div>

            <p className="mb-[39px] text-[16px] leading-[1.65] tracking-[0.01em] text-[#070707]">
                Based in Nicholasville, KY, BioPathogenix provides laboratories with
                quality wholesale supplies for qPCR and validation workflows.
            </p>

            <a
                href="https://www.linkedin.com/company/biopathogenix"
                target="_blank"
                className="inline-flex items-center gap-3 text-[16px] font-normal tracking-[0.01em] text-[#070707] transition hover:text-[#3e97ce]"
            >
                <FontAwesomeIcon
                    icon={faLinkedinIn}
                    className="text-[#3e97ce] text-[18px]"
                />

                FOLLOW US ON LINKEDIN
            </a>
        </div>
    );
}
