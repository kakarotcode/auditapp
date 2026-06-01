'use client'

import { cn } from '@/lib/utils'

interface Vertical {
  value: string
  label: string
  icon: string
  description: string
}

const VERTICALS: Vertical[] = [
  { value: 'CA_FIRM',      icon: '📊', label: 'CA / Accounting Firm', description: 'Chartered accountants, tax consultants' },
  { value: 'HEALTHCARE',   icon: '🏥', label: 'Healthcare',           description: 'Clinics, hospitals, diagnostic labs' },
  { value: 'NBFC',         icon: '🏦', label: 'NBFC / Fintech',       description: 'Loans, investments, payments' },
  { value: 'LAW_FIRM',     icon: '⚖️', label: 'Law Firm',             description: 'Advocates, legal consultants' },
  { value: 'EDTECH',       icon: '🎓', label: 'EdTech',               description: 'Online courses, tutoring platforms' },
  { value: 'HR_TECH',      icon: '👥', label: 'HR / Staffing',        description: 'HR software, recruitment agencies' },
  { value: 'INSURANCE',    icon: '🛡️', label: 'Insurance',            description: 'IRDAI-regulated insurers, brokers' },
  { value: 'ECOMMERCE',    icon: '🛒', label: 'E-Commerce',           description: 'Online retail, marketplaces' },
  { value: 'REAL_ESTATE',  icon: '🏠', label: 'Real Estate',          description: 'Property, brokerage, housing' },
  { value: 'OTHER',        icon: '🏢', label: 'Other',                description: 'Any other business' },
]

interface Props {
  value: string
  onChange: (val: string) => void
}

export function VerticalSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {VERTICALS.map(v => (
        <button
          key={v.value}
          type="button"
          onClick={() => onChange(v.value)}
          className={cn(
            'flex flex-col items-start rounded-xl border p-3 text-left transition-all',
            value === v.value
              ? 'border-[#0F2B5B] bg-[#0F2B5B]/5 ring-2 ring-[#0F2B5B]/20'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          )}
        >
          <span className="text-xl mb-1">{v.icon}</span>
          <span className="text-sm font-semibold text-gray-900">{v.label}</span>
          <span className="text-xs text-gray-500 mt-0.5">{v.description}</span>
        </button>
      ))}
    </div>
  )
}
