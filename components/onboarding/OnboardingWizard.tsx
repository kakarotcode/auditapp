'use client'

import { cn } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

interface Step {
  id: number
  label: string
}

interface Props {
  steps: Step[]
  currentStep: number
  children: React.ReactNode
}

export function OnboardingWizard({ steps, currentStep, children }: Props) {
  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all',
              i + 1 < currentStep ? 'bg-green-500 text-white' :
              i + 1 === currentStep ? 'bg-[#0F2B5B] text-white shadow-md' :
              'bg-gray-200 text-gray-500'
            )}>
              {i + 1 < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
            </div>
            <div className="ml-1.5 flex-1 text-xs hidden sm:block">
              <span className={cn(
                'font-medium',
                i + 1 === currentStep ? 'text-[#0F2B5B]' : 'text-gray-400'
              )}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-0.5 flex-1 mx-1', i + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div>{children}</div>
    </div>
  )
}
