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

// ============================================
// PREPAID EXPENSE FUNCTIONS
// ============================================

// Get inclusive days between two dates (14.01 to 31.01 = 18 days)
// Prepaid periods are inclusive, unlike rollover periods
export function getDaysInclusive(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
}

// Get full month name
export function getMonthName(date) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  return months[new Date(date).getMonth()]
}

// Calculate the number of months for a contract
// 14.01.2026 to 13.01.2027 = 12 months
// 13.02.2026 to 12.08.2026 = 6 months
export function calculateMonths(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (end.getDate() >= start.getDate()) months += 1
  return months
}

// Split a prepaid contract into calendar periods
// First period: start_date to end of start_month (partial if start isn't 1st)
// Middle periods: full calendar months
// Last period: 1st of end_month to end_date (partial if end isn't last day)
export function splitPrepaidPeriods(startDate, endDate) {
  const periods = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  let current = new Date(start)

  while (current <= end) {
    const periodStart = new Date(current)
    const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0)

    let periodEnd
    let isFullMonth

    if (lastDayOfMonth <= end) {
      periodEnd = lastDayOfMonth
      isFullMonth = periodStart.getDate() === 1
    } else {
      periodEnd = new Date(end)
      isFullMonth = false
    }

    periods.push({
      start: formatDateISO(periodStart),
      end: formatDateISO(periodEnd),
      isFullMonth,
      days: getDaysInclusive(periodStart, periodEnd)
    })

    // Move to the 1st of the next month
    current = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 1)
  }

  return periods
}

// Calculate prepaid amount for a period
// Full months: total / months
// Partials: (total / months) × (period_days / total_partial_days)
export function calculatePrepaidAmount(totalAmount, months, period, allPeriods) {
  const monthlyAmount = totalAmount / months

  if (period.isFullMonth) {
    return monthlyAmount
  }

  const partialPeriods = allPeriods.filter(p => !p.isFullMonth)
  const totalPartialDays = partialPeriods.reduce((sum, p) => sum + p.days, 0)

  if (totalPartialDays === 0) return 0

  return monthlyAmount * (period.days / totalPartialDays)
}

// Default prepaid narration templates
export const defaultPrepaidTemplates = {
  fullMonth:
    'Being {description} expense for {monthName} {year} vide adjusted against {prepaidLedger} for the period {startDate} to {endDate} ({totalAmount}/{months})',

  partialMonth:
    'Being {description} expense for {monthName} {year} (part period {periodStart} to {periodEnd}) vide adjusted against {prepaidLedger} for the period {startDate} to {endDate} ({totalAmount}/{months}/{totalPartialDays}*{daysInPeriod})'
}

// ============================================
// NUMBER TO TEXT FUNCTIONS
// ============================================

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen']

const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

// Indian numbering scale
const indianScale = ['', 'Thousand', 'Lakh', 'Crore', 'Arab', 'Kharab']

// International numbering scale
const intlScale = ['', 'Thousand', 'Million', 'Billion', 'Trillion']

// Convert 0-99 to words
function twoDigitsToWords(n, useHyphen) {
  if (n < 20) return ones[n]
  const ten = Math.floor(n / 10)
  const one = n % 10
  if (one === 0) return tens[ten]
  return useHyphen ? `${tens[ten]}-${ones[one]}` : `${tens[ten]} ${ones[one]}`
}

// Convert 0-999 to words
function threeDigitsToWords(n, useHyphen, useAnd) {
  const hundred = Math.floor(n / 100)
  const rest = n % 100
  let result = ''
  if (hundred > 0) {
    result = `${ones[hundred]} Hundred`
  }
  if (rest > 0) {
    if (useAnd) {
      result += (result ? ' and ' : '') + twoDigitsToWords(rest, useHyphen)
    } else {
      result += (result ? ' ' : '') + twoDigitsToWords(rest, useHyphen)
    }
  }
  return result
}

// Convert integer to words — International system
function integerToWordsIntl(n, useHyphen, useAnd) {
  if (n === 0) return 'Zero'

  const groups = []
  let num = n
  while (num > 0) {
    groups.push(num % 1000)
    num = Math.floor(num / 1000)
  }

  let result = ''
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue
    const groupWords = threeDigitsToWords(groups[i], useHyphen, useAnd)
    if (i === 0) {
      result += (result ? ' ' : '') + groupWords
    } else {
      result += (result ? ' ' : '') + groupWords + ' ' + intlScale[i]
    }
  }
  return result
}

// Convert integer to words — Indian system
function integerToWordsIndian(n, useHyphen, useAnd) {
  if (n === 0) return 'Zero'

  let result = ''
  let num = n

  // Handle crores (10,000,000)
  const crore = Math.floor(num / 10000000)
  num = num % 10000000
  if (crore > 0) {
    result += threeDigitsToWords(crore, useHyphen, useAnd) + ' Crore'
  }

  // Handle lakhs (100,000)
  const lakh = Math.floor(num / 100000)
  num = num % 100000
  if (lakh > 0) {
    result += (result ? ' ' : '') + threeDigitsToWords(lakh, useHyphen, useAnd) + ' Lakh'
  }

  // Handle thousands
  const thousand = Math.floor(num / 1000)
  num = num % 1000
  if (thousand > 0) {
    result += (result ? ' ' : '') + threeDigitsToWords(thousand, useHyphen, useAnd) + ' Thousand'
  }

  // Handle hundreds
  if (num > 0) {
    result += (result ? ' ' : '') + threeDigitsToWords(num, useHyphen, useAnd)
  }

  return result
}

// Main function: convert a number to currency text
export function numberToCurrencyText(amount, options = {}) {
  const {
    currencyCode = 'USD',
    currencyName = 'US Dollars',
    fractionUnitName = 'Cents', // NEW: customizable (Paise, Pence, Fils, etc.)
    useHyphen = false,
    useAnd = true,
    useOnly = false,
    centsAsWords = true,
    indianSystem = false,
    usePrefix = true
  } = options

  // Round to 2 decimals
  const rounded = Math.round(amount * 100) / 100
  const integerPart = Math.floor(rounded)
  const decimalPart = Math.round((rounded - integerPart) * 100)

  const intWords = indianSystem
    ? integerToWordsIndian(integerPart, useHyphen, useAnd)
    : integerToWordsIntl(integerPart, useHyphen, useAnd)

  let result = ''

  // Currency prefix (code) or suffix (name)
  if (usePrefix) {
    result = `${currencyCode} ${intWords}`
  } else {
    result = `${intWords} ${currencyName}`
  }

  // Fractional unit (Cents / Paise / Pence / etc.)
  if (decimalPart > 0) {
    if (centsAsWords) {
      const centWords = indianSystem
        ? integerToWordsIndian(decimalPart, useHyphen, useAnd)
        : integerToWordsIntl(decimalPart, useHyphen, useAnd)
      // Prefix format: "and Cents Sixty Eight"
      // Suffix format: "and Sixty Eight Cents"
      if (usePrefix) {
        result += ` and ${fractionUnitName} ${centWords}`
      } else {
        result += ` and ${centWords} ${fractionUnitName}`
      }
    } else {
      result += ` and ${String(decimalPart).padStart(2, '0')}/100`
    }
  }

  // "Only" suffix
  if (useOnly) {
    result += ' Only'
  }

  return result
}

// ============================================
// CUSTOM RULE BUILDER FUNCTIONS
// ============================================

// Generate period dates based on frequency and trigger
export function generatePeriodDates(startDate, endDate, frequency, trigger) {
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  let current = new Date(start)
  let safety = 0
  
  while (current <= end && safety < 1000) {
    safety++
    
    let periodDate
    
    if (frequency === 'daily') {
      periodDate = new Date(current)
    } else if (frequency === 'weekly') {
      const day = current.getDay()
      if (trigger === 'first') {
        periodDate = new Date(current)
        periodDate.setDate(current.getDate() - ((day + 6) % 7))
      } else {
        periodDate = new Date(current)
        periodDate.setDate(current.getDate() + (7 - day) % 7)
      }
    } else if (frequency === 'monthly') {
      if (trigger === 'first') {
        periodDate = new Date(current.getFullYear(), current.getMonth(), 1)
      } else {
        periodDate = new Date(current.getFullYear(), current.getMonth() + 1, 0)
      }
    } else if (frequency === 'quarterly') {
      const qStartMonth = Math.floor(current.getMonth() / 3) * 3
      if (trigger === 'first') {
        periodDate = new Date(current.getFullYear(), qStartMonth, 1)
      } else {
        periodDate = new Date(current.getFullYear(), qStartMonth + 3, 0)
      }
    } else if (frequency === 'biannually') {
      const hStartMonth = Math.floor(current.getMonth() / 6) * 6
      if (trigger === 'first') {
        periodDate = new Date(current.getFullYear(), hStartMonth, 1)
      } else {
        periodDate = new Date(current.getFullYear(), hStartMonth + 6, 0)
      }
    } else if (frequency === 'yearly') {
      if (trigger === 'first') {
        periodDate = new Date(current.getFullYear(), 0, 1)
      } else {
        periodDate = new Date(current.getFullYear(), 11, 31)
      }
    }
    
    if (periodDate >= start && periodDate <= end) {
      const iso = formatDateISO(periodDate)
      if (!dates.includes(iso)) {
        dates.push(iso)
      }
    }
    
    // Advance to next period
    if (frequency === 'daily') {
      current = new Date(current)
      current.setDate(current.getDate() + 1)
    } else if (frequency === 'weekly') {
      current = new Date(current)
      current.setDate(current.getDate() + 7)
    } else if (frequency === 'monthly') {
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    } else if (frequency === 'quarterly') {
      const qStartMonth = Math.floor(current.getMonth() / 3) * 3
      current = new Date(current.getFullYear(), qStartMonth + 3, 1)
    } else if (frequency === 'biannually') {
      const hStartMonth = Math.floor(current.getMonth() / 6) * 6
      current = new Date(current.getFullYear(), hStartMonth + 6, 1)
    } else if (frequency === 'yearly') {
      current = new Date(current.getFullYear() + 1, 0, 1)
    }
  }
  
  return dates
}

// Format date by type
export function formatDateByType(date, formatType) {
  const d = new Date(date)
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  switch (formatType) {
    case 'full': return formatDate(d)
    case 'monthName': return monthShort[d.getMonth()]
    case 'monthNameFull': return monthFull[d.getMonth()]
    case 'year': return String(d.getFullYear())
    case 'iso': return formatDateISO(d)
    case 'dayNumber': return String(d.getDate())
    case 'monthNumber': return String(d.getMonth() + 1).padStart(2, '0')
    default: return formatDate(d)
  }
}

// Evaluate a formula safely
export function evaluateFormula(formula, values) {
  let expr = formula
  
  // Replace placeholder references with raw values
  for (const [key, value] of Object.entries(values)) {
    expr = expr.replace(new RegExp(`\\{${key}\\}`, 'g'), `(${value})`)
  }
  
  // Remove commas from numbers (user might type 12,000/12)
  expr = expr.replace(/(\d),(\d)/g, '$1$2')
  
  // Sanitize — only allow numbers, operators, parentheses, spaces
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    return null
  }
  
  try {
    const result = new Function(`return ${expr}`)()
    if (typeof result !== 'number' || !isFinite(result)) return null
    return result
  } catch (e) {
    return null
  }
}

// Format formula for display (replace placeholders with formatted values)
export function formatFormulaForDisplay(formula, displayValues) {
  let result = formula
  for (const [key, value] of Object.entries(displayValues)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}