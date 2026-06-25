"use client"
import { useState } from "react"
import { FileText, Search } from "lucide-react"

interface Document {
  id: number
//   lot_number: string
  certificate_type: string
//   date: string
//   catalog_numbers: string
  file_url: string
  title: string
}

interface DocumentsTabProps {
  documents: Document[]
}

export default function ProductDocuments({ documents }: DocumentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const filtered = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearch = () => {
    setSearchQuery(searchInput)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div className="w-full ">
        {/* py-6 */}

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Documents & Downloads
      </h2>

      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Certificates
      </h3>

      <div className="flex mb-8">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by lot number or partial lot number"
          className="flex-1 border border-gray-400 rounded-l px-4 py-2 text-sm outline-none focus:border-gray-500"
        />
        <button
          onClick={handleSearch}
          className="px-5 py-2 border border-l-0 border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-r"
        >
          Search
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left font-bold text-gray-900 pb-3 w-1/4">
              Lot #
            </th>
            <th className="text-left font-bold text-gray-900 pb-3 w-1/4">
              Certificate Type
            </th>
            {/* <th className="text-left font-bold text-gray-900 pb-3 w-1/4">
              Date
            </th>
            <th className="text-left font-bold text-gray-900 pb-3 w-1/4">
              Catalog Number(s)
            </th> */}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filtered.length > 0 ? (
            filtered.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50 transition">
                <td className="py-4">
                  
                    <a href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-500 hover:underline font-medium"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    {doc.title}
                  </a>
                </td>

                <td className="py-4 text-gray-700">
                  {doc.certificate_type}
                </td>

                {/* <td className="py-4 text-gray-700">
                  {doc.date}
                </td>

                <td className="py-4 text-gray-700">
                  {doc.catalog_numbers}
                </td> */}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                No documents found for "{searchQuery}"
              </td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  )
}