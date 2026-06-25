"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import DOMPurify from 'isomorphic-dompurify';

interface FAQ {
  id: number
  question: string
  answer: string
}

interface FAQProps {
  faqs: FAQ[]
}

export default function ProductFaqs({ faqs }: FAQProps) {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggle = (id: number) => {
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <div className="w-full py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Frequently asked questions (FAQs)
      </h2>

      <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
        {faqs.map(faq => (
          <div key={faq.id} className="py-4">

            <button
              onClick={() => toggle(faq.id)}
              className="w-full flex items-center justify-between gap-4 text-left"
            >
              <span
                className={`text-sm transition-all ${
                  openId === faq.id
                    ? "font-bold text-gray-900"
                    : "font-normal text-gray-700"
                }`}
              >
                {faq.question? <div  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.question)  }}/> : <></>}
              </span>
              {openId === faq.id
                ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
              }
            </button>

            {openId === faq.id && (
             
                faq.answer ? <div className="mt-4 text-sm text-gray-700 leading-relaxed space-y-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer)  }}/> : <></>


              
            )}

          </div>
        ))}
      </div>
    </div>
  )
}