export default function CatalogDownload() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div
          className="rounded-[28px] py-16 px-8 text-center"
          style={{
            background: "linear-gradient(135deg, #0b2e59 0%, #1a4a80 50%, #0e3a6e 100%)",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Explore the BioPathogenix Product Catalog
          </h2>
          <p className="text-white/80 text-base max-w-xl mx-auto mb-3 leading-relaxed">
            Download the complete BioPathogenix research portfolio to discover molecular
            assays, nucleic acid extraction kits, workflow tools, and laboratory supplies
            designed to support ever-evolving research environments.
          </p>
          <p className="text-white/70 text-base max-w-md mx-auto mb-10 leading-relaxed">
            Our catalog provides a convenient overview of available products and solutions
            across the BioPathogenix portfolio.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/files/2025-BioPathogenix-Product-Catalog 1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#00bcd4] hover:bg-[#00a8bc] text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm"
            >
              Download the Catalog
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
            <a
              href="/product"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-[#0b2e59] font-semibold px-8 py-3 rounded-full transition-colors text-sm"
            >
              Shop Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
