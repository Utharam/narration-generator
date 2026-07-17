// ============================================
// DATE FUNCTIONS
// ============================================

// Format date as DD-MMM-YYYY (05-Jan-2026)
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = String(d.getDate()).padStart(2, '0')
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

// Format date as ISO string (2026-01-05) for internal use and localStorage
export function formatDateISO(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get the next day after a date
export function getNextDate(date) {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return d
}

// Calculate days between two dates (closing - opening)
// This is simple date difference — interest accrues on holidays too
export function getDaysBetween(openingDate, closingDate) {
  const opening = new Date(openingDate)
  const closing = new Date(closingDate)
  const diffTime = closing - opening
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return Math.round(diffDays)
}

// Check if a date falls on a weekend (Saturday or Sunday)
export function isWeekend(date) {
  const day = new Date(date).getDay()
  return day === 0 || day === 6
}

// Check if a date is a working day (not weekend, not in holidays list)
export function isWorkingDay(date, holidays = []) {
  return !isWeekend(date) && !holidays.includes(formatDateISO(date))
}

// ============================================
// NUMBER AND CURRENCY FUNCTIONS
// ============================================

// Format number with international comma system: 514,858.98
function formatInternational(num) {
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Format number with Indian comma system: 5,14,858.98
// Last 3 digits stay together, then groups of 2 going left
function formatIndian(num) {
  const parts = Number(num).toFixed(2).split('.')
  let intPart = parts[0]
  const decPart = parts[1]

  if (intPart.length > 3) {
    const last3 = intPart.slice(-3)
    const rest = intPart.slice(0, -3)
    intPart = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
  }

  return intPart + '.' + decPart
}

// Format a number with the chosen comma system (no currency prefix)
export function formatNumber(amount, commaSystem) {
  return commaSystem === 'indian'
    ? formatIndian(amount)
    : formatInternational(amount)
}

// Format a number with currency code prefix: "USD 514,858.98"
export function formatCurrency(amount, currencyCode, commaSystem) {
  return `${currencyCode} ${formatNumber(amount, commaSystem)}`
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

// Get the denominator for interest calculation based on convention
export function getDenominator(convention, date) {
  switch (convention) {
    case '360':
      return 360
    case '365':
      return 365
    case 'actual':
      const year = date ? new Date(date).getFullYear() : new Date().getFullYear()
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
      return isLeap ? 366 : 365
    default:
      return 360
  }
}

// Calculate interest: (Principal × Rate × Days) / Denominator
export function calculateInterest(openingBalance, rate, days, convention, date) {
  const denominator = getDenominator(convention, date)
  const ratePercent = rate / 100
  return (openingBalance * ratePercent * days) / denominator
}

// Calculate closing balance: Opening + Interest
export function calculateClosingBalance(openingBalance, interest) {
  return openingBalance + interest
}

// ============================================
// TEMPLATE ENGINE
// ============================================

// Default narration templates with placeholders
// Placeholders: {bank}, {oldRate}, {newRate}, {currency}, {openingBalance},
//   {interest}, {closingBalance}, {days}, {openingDate}, {closingDate},
//   {nextDate}, {denominator}
export const defaultTemplates = {
  entryA:
    'Being interest charged on daily rollover deposit of {currency} {openingBalance} @ {oldRate}% p.a. for {days} days ({openingDate} to {closingDate}), interest amount {currency} {interest}',

  entryAWithCalc:
    'Being interest charged on daily rollover deposit of {currency} {openingBalance} @ {oldRate}% p.a. for {days} days ({openingDate} to {closingDate}), interest amount {currency} {interest} ({currency} {openingBalance} x {oldRate}% x {days}/{denominator})',

  entryB:
    'Being {bank} Daily Roll Over Deposit {oldRate}% (principal {currency} {openingBalance} + interest {currency} {interest} = {currency} {closingBalance}) rolled over from {closingDate} to {nextDate} to {bank} Daily Roll Over Deposit {newRate}%'
}

// Default ledger name templates
export const defaultLedgerTemplates = {
  oldDeposit: '{bank} Daily Roll Over Deposit {oldRate}%',
  newDeposit: '{bank} Daily Roll Over Deposit {newRate}%',
  interestIncome: 'Interest on {bank} Roll Over Deposits'
}

// Fill a template string with values
// Replaces all {placeholder} occurrences with corresponding values
export function fillTemplate(template, values) {
  let result = template
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
  }
  return result
}

// ============================================
// CSV EXPORT
// ============================================

// Export rows to a CSV file and trigger download
// Each row: { date, ledger, debit, credit, narration }
export function exportToCSV(rows, filename = 'narration_export.csv') {
  const headers = ['Date', 'Ledger Name', 'Debit', 'Credit', 'Narration']
  const csvLines = [headers.join(',')]

  for (const row of rows) {
    const values = [
      row.date,
      `"${row.ledger}"`,
      row.debit || '',
      row.credit || '',
      `"${row.narration}"`
    ]
    csvLines.push(values.join(','))
  }

  const csvContent = csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.click()
  URL.revokeObjectURL(url)
}

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function loadFromStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (e) {
    console.error('Failed to load from localStorage:', e)
    return defaultValue
  }
}