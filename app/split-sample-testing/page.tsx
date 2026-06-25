import Image from "next/image";

export default function PCRSplitSamplePage() {
    return (
        <main className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-16">

                {/* Header */}
                <div className="text-center mb-14">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#0B3C5D]">
                        PCR Panel Split Sample Testing
                    </h1>
                    <p className="mt-4 text-[#0B3C5D] text-sm md:text-base max-w-3xl mx-auto">
                        The BioPathogenix Split Sample Testing program will be covering
                        the UTI, STI, RPP, Women’s Health, Wound, and Nail Fungal panels.
                    </p>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

                    {/* Image */}
                    <div className="rounded-xl overflow-hidden shadow-sm">
                        <Image
                            src="/images/quality-control/Split-Sample-Testing.jpeg"
                            alt="PCR Lab"
                            width={800}
                            height={500}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Program Details */}
                    <div className="bg-[#F3FAFE] rounded-xl p-8">
                        <h2 className="text-xl font-semibold text-[#0B3C5D] mb-5">
                            Split Sample Program Details
                        </h2>

                        <ul className="space-y-3 text-[#0B3C5D] text-sm">
                            <li>▶ By joining the split sample testing program your company can be part of the group of peer laboratories to evaluate test performance.</li>
                            <li>▶ Each Panel is covered biannually and contains at least 10 samples for each event.</li>
                            <li>▶ Each event will provide at least 90% coverage for all pathogens offered by Biopathogenix kits.</li>
                            <li>▶ For each event, 10 samples will be shipped to your laboratory. Results will be due in two weeks.</li>
                            <li>▶ You will be provided the link to the portal to add and review your results.</li>
                            <li>▶ You will receive the final report comparing your results with peer group.</li>
                        </ul>

                        <p className="mt-6 text-sm text-[#0B3C5D]">
                            To access the Split Sample Portal, visit
                            <br />
                            <span className="font-semibold">splitsample.biopathogenix.com</span>
                        </p>
                    </div>

                    {/* What is Split Sample */}
                    <div className="bg-[#F3FAFE] rounded-xl p-8">
                        <h3 className="text-lg font-semibold text-[#0B3C5D] mb-3">
                            What is Split Sample Testing?
                        </h3>
                        <p className="text-[#0B3C5D] text-sm leading-relaxed">
                            Split Sample Testing is a method of comparing the quality of your
                            methods with peer laboratories. Split Sample Testing allows you
                            to compare your results with the results of other laboratories by
                            testing the same sample, verifying the accuracy of your tests.
                        </p>
                    </div>

                    {/* Why Important */}
                    <div className="bg-[#F3FAFE] rounded-xl p-8">
                        <h3 className="text-lg font-semibold text-[#0B3C5D] mb-3">
                            Why Is It Important For Your Lab?
                        </h3>
                        <p className="text-[#0B3C5D] text-sm leading-relaxed">
                            Split sample testing allows you to compare the performance of your
                            test with group of peer labs. This program is designed to give you
                            greater confidence in the accuracy and reliability of your test
                            method.
                        </p>
                    </div>

                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-20">
                    <h2 className="text-2xl md:text-3xl font-semibold text-[#0B3C5D]">
                        Join Our Group of<br />Peer Laboratories
                    </h2>
                </div>

                {/* Registration Form */}
                <div className="mt-10 max-w-xl mx-auto bg-[#F3FAFE] rounded-xl p-8 shadow-sm">
                    <p className="text-center text-sm text-[#0B3C5D] mb-6">
                        To register for Split Sample Testing, fill out the form below.
                    </p>

                    <form className="space-y-4">

                        <div>
                            <label className="block text-sm font-medium text-[#0B3C5D] mb-1">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white rounded border border-gray-300 px-3 py-2 text-sm 
        focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0B3C5D] mb-1">
                                Company Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white rounded border border-gray-300 px-3 py-2 text-sm 
        focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0B3C5D] mb-1">
                                Contact Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white rounded border border-gray-300 px-3 py-2 text-sm 
        focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0B3C5D] mb-1">
                                Contact Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full bg-white rounded border border-gray-300 px-3 py-2 text-sm 
        focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0B3C5D] mb-1">
                                Additional Contacts
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Provide the name & email for each contact."
                                className="w-full bg-white rounded border border-gray-300 px-3 py-2 text-sm 
        focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[#0B3C5D] mb-2">
                                Select Split Sample Program(s)
                            </p>

                            <div className="space-y-2 text-sm text-[#0B3C5D]">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" /> UTI Panel – Jan & July – $1000
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" /> Wound Panel – Feb & August – $1000
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" /> Nail Fungal – March & Sept – $1000
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" /> Women’s Health – April & Oct – $1000
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" /> GI Panel – May & Nov – $1000
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" /> Respiratory Panel – June & Dec – $1000
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" /> STI Panel – Jan & July – $500
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="mt-4 inline-flex items-center justify-center rounded-md bg-[#0B7ACF] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#095f9f] transition"
                        >
                            Register
                        </button>

                    </form>
                </div>


            </div>
        </main>
    );
}
