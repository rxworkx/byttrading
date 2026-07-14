import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Plan rate ranges are stored as "min-max" for parsing on the backend;
// render them as "min to max" so no dash reaches the screen.
export function formatRateRange(range: string) {
  return range.replace("-", " to ")
}

// payFrequency is a free-form duration string ("1 day", "5 min", or just
// "daily"/"hourly" etc, a bare unit implies a quantity of 1). Both "1 day"
// and "daily" read as the same plain word instead of the awkward "every
// daily".
export function isDailyFrequency(payFrequency: string) {
  const trimmed = payFrequency.trim().toLowerCase()
  return trimmed === "1 day" || trimmed === "daily"
}

export function formatPayFrequency(payFrequency: string) {
  return isDailyFrequency(payFrequency) ? "Profit added daily" : `Profit added every ${payFrequency}`
}

export function formatPayFrequencyShort(payFrequency: string) {
  return isDailyFrequency(payFrequency) ? "Daily" : `Every ${payFrequency}`
}

// Single line combining the rate and how often it pays, e.g. "0.25 to 0.6%
// daily" or "10% every 1 min", replacing a separate "Profit added every X"
// sentence underneath.
export function formatRateFrequency(rateRange: string, payFrequency: string) {
  const frequency = isDailyFrequency(payFrequency) ? "daily" : `every ${payFrequency}`
  return `${formatRateRange(rateRange)}% ${frequency}`
}

// 24 hour time, no comma, no AM/PM, e.g. "10 Jul 2026 15:45".
export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  const timePart = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
  return `${datePart} ${timePart}`
}

// Date only, same no-comma style, e.g. "10 Jul 2026".
export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// A few enum values read better under custom copy than a literal title-cased
// transform of their DB name.
const LABEL_OVERRIDES: Record<string, string> = {
  PRINCIPAL_RELEASE: "Return Capital",
  PROFIT_CREDIT: "Profit",
  INVESTMENT_LOCK: "Trade Lock",
  INVESTMENT: "Trade",
}

// Turns a SCREAMING_SNAKE_CASE enum value (transaction type, status, etc)
// into a readable label, e.g. "WITHDRAWAL" -> "Withdrawal".
export function formatLabel(value: string) {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value]
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
