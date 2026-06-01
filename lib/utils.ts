import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Class name combiner (shadcn/ui compatible)
// ---------------------------------------------------------------------------

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Currency formatting — Indian rupee with Indian grouping (e.g. ₹1,23,456)
// ---------------------------------------------------------------------------

export function formatINR(amount: number): string {
  const absAmount = Math.abs(amount)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount)

  return amount < 0 ? `-${formatted}` : formatted
}

// ---------------------------------------------------------------------------
// Date helpers — all formatted in IST (Asia/Kolkata)
// ---------------------------------------------------------------------------

const IST_LOCALE = 'en-IN'
const IST_TIMEZONE = 'Asia/Kolkata'

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(IST_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: IST_TIMEZONE,
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const datePart = new Intl.DateTimeFormat(IST_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: IST_TIMEZONE,
  }).format(d)

  const timePart = new Intl.DateTimeFormat(IST_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: IST_TIMEZONE,
  }).format(d)

  return `${datePart} ${timePart} IST`
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  return `${years} year${years === 1 ? '' : 's'} ago`
}

// ---------------------------------------------------------------------------
// Name initials (up to 2 characters)
// ---------------------------------------------------------------------------

export function getInitials(name: string): string {
  if (!name.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string

export function severityColor(severity: Severity): string {
  switch (severity.toUpperCase()) {
    case 'LOW':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'MEDIUM':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'HIGH':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'CRITICAL':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function severityEmoji(severity: Severity): string {
  switch (severity.toUpperCase()) {
    case 'LOW':
      return '🟢'
    case 'MEDIUM':
      return '🟡'
    case 'HIGH':
      return '🟠'
    case 'CRITICAL':
      return '🔴'
    default:
      return '⚪'
  }
}

// ---------------------------------------------------------------------------
// Staff anonymization — SHA-256 hash of an identifier
// ---------------------------------------------------------------------------

export function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

// ---------------------------------------------------------------------------
// Invoice number generator — format: KAV/YYYY-YY/XXXX
// e.g. KAV/2026-27/0001
// ---------------------------------------------------------------------------

export function generateInvoiceNumber(sequence: number): string {
  const now = new Date()
  // Indian financial year starts April 1st
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  const shortNextYear = String(year + 1).slice(2)
  const fy = `${year}-${shortNextYear}`
  const seq = String(sequence).padStart(4, '0')
  return `KAV/${fy}/${seq}`
}
