'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

function Accordion({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all"
      style={{ borderColor: isOpen ? '#C9A84C' : '#ddd9d0' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span
          className="font-semibold text-sm sm:text-base"
          style={{ color: '#1B2B5B' }}
        >
          {question}
        </span>
        <ChevronDown
          className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
          style={{
            color: '#C9A84C',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: isOpen ? '500px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div
          className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t"
          style={{ borderColor: '#ede9df' }}
        >
          <p className="pt-4">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export function FaqAccordion({
  items,
}: {
  items: { question: string; answer: string }[]
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <Accordion
          key={idx}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === idx}
          onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
        />
      ))}
    </div>
  )
}
