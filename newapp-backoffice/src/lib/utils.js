import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

// Helper standard shadcn/ui per combinare className condizionali
// e risolvere conflitti di utility Tailwind
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Formatter currency EUR locale it-IT (sezione 7 della spec)
const _currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
export function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return _currencyFormatter.format(value)
}

// Numero intero/decimal con separatore italiano (3.190 invece di 3,190)
const _intFormatter = new Intl.NumberFormat('it-IT')
export function formatNumber(value, decimals) {
  if (value == null || Number.isNaN(value)) return '—'
  if (decimals != null) {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }
  return _intFormatter.format(value)
}

// Percentuale (input 0-100): "12,4%"
export function formatPercent(value, decimals = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value) + '%'
}

// Data nel formato DD/MM/YYYY HH:mm — accetta Date, ISO string o timestamp
export function formatDate(input, fmt = 'dd/MM/yyyy HH:mm') {
  if (!input) return '—'
  const date = typeof input === 'string' ? parseISO(input) : input
  if (Number.isNaN(date?.getTime?.())) return '—'
  return format(date, fmt, { locale: it })
}

// Solo data: 28/05/2026
export function formatDateOnly(input) {
  return formatDate(input, 'dd/MM/yyyy')
}

// Distanza relativa: "2 ore fa", "3 minuti fa"
export function formatRelative(input) {
  if (!input) return '—'
  const date = typeof input === 'string' ? parseISO(input) : input
  if (Number.isNaN(date?.getTime?.())) return '—'
  return formatDistanceToNow(date, { locale: it, addSuffix: true })
}

// Mascheratura telefono: "+393485671234" → "+39 348 ****1234"
export function maskPhone(phone) {
  if (!phone) return '—'
  const digits = String(phone).replace(/\s+/g, '')
  if (digits.length < 4) return digits
  const last4 = digits.slice(-4)
  const prefix = digits.slice(0, digits.length - 7)
  return `${prefix} ****${last4}`
}
