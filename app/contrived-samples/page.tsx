"use client";

import { useState } from "react";
import Image from "next/image";

export default function ContrivedSamplesPage() {
  return (
    <main className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-20">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B3C5D]">
            BioBank/Contrived Samples
          </h1>

          <p className="mt-4 text-blue-600 font-medium">
            A control designed to assess the performance of downstream molecular assays.
          </p>

          <p className="mt-6 text-[#0B3C5D] max-w-4xl mx-auto leading-relaxed">
            A contrived specimen is a sample that is intentionally created manipulated for research purposes. It is typically produced in a laboratory setting and may not naturally occur in the body. Our contrived specimen samples can be seamlessly contrived into any matrix of your choice, allowing you to mimic diverse biological, environmental, or clinical samples for qPCR analysis.
          </p>
        </div>

        {/* Product Features */}
        <div className="bg-[#F3FAFE] rounded-2xl p-12 grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          <div>
            <h2 className="text-2xl font-semibold text-[#0B3C5D] mb-6">
              Product Features
            </h2>

            <ul className="space-y-6 text-[#0B3C5D]">
              <li className="flex gap-3">
                <span className="text-blue-600">▶</span>
                <span>
                  <strong>Reliable Controls:</strong> Our contrived specimen samples serve as reliable positive and negative controls for qPCR assays, ensuring accurate and consistent results.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="text-blue-600">▶</span>
                <span>
                  <strong>Quantification Standards:</strong> Our contrived specimens are quantified to known concentrations, providing a reference point for determining the relative abundance of target sequences in unknown samples.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-14 md:pt-12">
            <ul className="space-y-6 text-[#0B3C5D]">
              <li className="flex gap-3">
                <span className="text-blue-600">▶</span>
                <span>
                  <strong>Quality Assurance:</strong> Incorporating contrived specimen samples in qPCR workflows helps ensure the quality and reliability of results, enhancing the overall confidence in research findings and data interpretation.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="text-blue-600">▶</span>
                <span>
                  <strong>Quality Control:</strong> Utilize our contrived specimens as internal controls to monitor the efficiency and performance of your qPCR workflow, from nucleic acid extraction to amplification and detection.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Order Instructions */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-[#0B3C5D] mb-8">
            Order Instructions
          </h2>

          <ol className="max-w-2xl mx-auto space-y-4 text-[#0B3C5D] text-base md:text-lg leading-relaxed">
            <li>
              <span className="font-medium">1.</span>{" "}
              <a
                href="/files/Bio-Repository-Order-Sheet.xlsx"
                target="_blank"
                className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
              >
                Click here to download the order sheet.
              </a>
            </li>

            <li>
              <span className="font-medium">2.</span> Fill it out, indicating the details of your order.
            </li>

            <li>
              <span className="font-medium">3.</span> Save your form, download it, and submit it to our team using the form below, or by emailing it to{" "}
              <a
                href="mailto:order@biopathogenix.com"
                className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
              >
                order@biopathogenix.com
              </a>
            </li>
          </ol>
        </div>

        {/* Order Form */}
        <div className="max-w-4xl mx-auto bg-[#F3FAFE] rounded-2xl p-12 shadow-sm">
          <form className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#0B3C5D] mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-white rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3C5D] mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-white rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3C5D] mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                className="w-full bg-white rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3C5D] mb-2">
                Upload Your Completed Order Form <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3 bg-white border border-gray-300 rounded px-3 py-2">
                <label className="cursor-pointer rounded border border-gray-400 bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200">
                  Choose file
                  <input
                    type="file"
                    required
                    className="hidden"
                    onChange={(e) => {
                      const label = e.currentTarget
                        .closest('div')
                        ?.querySelector('[data-filename]') as HTMLElement | null;
                      if (label && e.target.files?.length) {
                        label.innerText = e.target.files[0].name;
                      }
                    }}
                  />
                </label>

                <span data-filename className="text-sm text-gray-500">
                  No file chosen
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-[#0B7ACF] py-4 text-lg font-semibold text-white hover:bg-[#095f9f] transition"
            >
              Submit Order Request
            </button>

          </form>
        </div>

      </div>
    </main>
  );
}
