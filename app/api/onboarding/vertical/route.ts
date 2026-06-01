import { NextRequest, NextResponse } from 'next/server'
import type { Vertical, Framework } from '@prisma/client'

export const dynamic = 'force-dynamic'

const verticalFrameworks: Record<Vertical, Framework[]> = {
  CA_FIRM: ['DPDP', 'IT_ACT', 'SEBI'],
  HEALTHCARE: ['DPDP', 'IT_ACT', 'NMC'],
  FINANCIAL: ['DPDP', 'IT_ACT', 'RBI', 'SEBI', 'IRDAI'],
  LEGAL: ['DPDP', 'IT_ACT', 'BAR_COUNCIL'],
  EDTECH: ['DPDP', 'IT_ACT', 'POCSO'],
  HR_TECH: ['DPDP', 'IT_ACT', 'LABOUR_LAW'],
  GENERAL: ['DPDP', 'IT_ACT'],
}

const frameworkDescriptions: Record<Framework, string> = {
  DPDP: 'Digital Personal Data Protection Act, 2023 — India\'s primary data protection law',
  IT_ACT: 'Information Technology Act, 2000 — Governs electronic commerce, cybercrime, and data security',
  RBI: 'Reserve Bank of India guidelines on data localisation and cyber security',
  SEBI: 'Securities and Exchange Board of India cybersecurity and data protection framework',
  IRDAI: 'Insurance Regulatory and Development Authority of India cybersecurity guidelines',
  NMC: 'National Medical Commission regulations on patient data and telemedicine',
  BAR_COUNCIL: 'Bar Council of India rules on client data confidentiality and legal ethics',
  LABOUR_LAW: 'Labour law compliance — employee data handling and workplace privacy regulations',
  POCSO: 'Protection of Children from Sexual Offences — mandatory reporting and data protection for minors',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const vertical = searchParams.get('vertical') as Vertical | null

  if (vertical && !(vertical in verticalFrameworks)) {
    return NextResponse.json(
      { error: 'Invalid vertical', code: 'INVALID_VERTICAL' },
      { status: 400 }
    )
  }

  if (vertical) {
    const frameworks = verticalFrameworks[vertical]
    return NextResponse.json({
      vertical,
      suggestedFrameworks: frameworks.map((fw) => ({
        code: fw,
        description: frameworkDescriptions[fw],
      })),
    })
  }

  // Return all verticals with their frameworks
  const all = Object.entries(verticalFrameworks).map(([v, frameworks]) => ({
    vertical: v as Vertical,
    suggestedFrameworks: frameworks.map((fw) => ({
      code: fw,
      description: frameworkDescriptions[fw],
    })),
  }))

  return NextResponse.json({ verticals: all })
}
