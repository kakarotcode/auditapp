'use client'

import { cn } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

interface Framework {
  value: string
  label: string
  desc: string
  required?: boolean
}

const FRAMEWORKS: Framework[] = [
  { value: 'DPDP',        label: 'DPDP Act 2023',      desc: "India's primary data protection law — applies to all",       required: true },
  { value: 'IT_ACT',      label: 'IT Act 2000',         desc: 'Information Technology Act — cybersecurity & digital',       required: true },
  { value: 'RBI',         label: 'RBI Guidelines',      desc: 'Reserve Bank of India — banks, NBFCs, payment companies' },
  { value: 'SEBI',        label: 'SEBI Regulations',    desc: 'Securities and Exchange Board — investment advisors, brokers' },
  { value: 'IRDAI',       label: 'IRDAI Guidelines',    desc: 'Insurance Regulatory Authority — insurance companies' },
  { value: 'NMC',         label: 'NMC Code',            desc: 'National Medical Commission — doctors, clinics, hospitals' },
  { value: 'BAR_COUNCIL', label: 'Bar Council Rules',   desc: 'Bar Council of India — law firms and advocates' },
  { value: 'LABOUR_LAW',  label: 'Labour Laws',         desc: 'PF Act, POSH Act, Contract Labour Act — all employers' },
  { value: 'POCSO',       label: 'POCSO Act',           desc: "Child protection data rules — edtech and children's platforms" },
]

interface Props {
  value: string[]
  onChange: (val: string[]) => void
}

export function FrameworkSelector({ value, onChange }: Props) {
  function toggle(fw: string) {
    if (value.includes(fw)) onChange(value.filter(v => v !== fw))
    else onChange([...value, fw])
  }

  return (
    <div className="space-y-2">
      {FRAMEWORKS.map(fw => {
        const selected = value.includes(fw.value)
        const disabled = fw.required
        return (
          <button
            key={fw.value}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && toggle(fw.value)}
            className={cn(
              'w-full rounded-lg border p-3 text-left transition-all',
              selected ? 'border-[#0F2B5B] bg-[#0F2B5B]/5' : 'border-gray-200 hover:border-gray-300',
              disabled && 'cursor-not-allowed opacity-80',
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{fw.label}</span>
                  {fw.required && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Required</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{fw.desc}</p>
              </div>
              <div className={cn('h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ml-3',
                selected ? 'border-[#0F2B5B] bg-[#0F2B5B]' : 'border-gray-300',
              )}>
                {selected && <CheckCircle className="h-3 w-3 text-white" />}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
