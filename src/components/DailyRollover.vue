<template>
  <div class="daily-rollover">

    <!-- === GLOBAL SETTINGS === -->
    <section class="card">
      <h2>Daily Roll Over Deposit</h2>

      <div class="form-grid">
        <div class="form-group">
          <label>Bank Name</label>
          <input type="text" v-model="bankName" placeholder="Standard Chartered Bank">
        </div>

        <div class="form-group">
          <label>Currency</label>
          <select v-model="selectedCurrencyCode">
            <option v-for="c in allCurrencies" :key="c.code" :value="c.code">
              {{ c.code }} ({{ c.symbol }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Number Format</label>
          <select v-model="commaSystem">
            <option value="international">International (514,858.98)</option>
            <option value="indian">Indian (5,14,858.98)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Day Count Convention</label>
          <select v-model="dayCountConvention">
            <option value="360">Actual/360 (default)</option>
            <option value="365">Actual/365</option>
            <option value="actual">Actual/Actual (366 in leap year)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Opening Balance</label>
          <input type="number" v-model.number="initialBalance" step="0.01" placeholder="514858.98">
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="showCalculation">
            Show calculation in narration
          </label>
        </div>
      </div>

      <div class="currency-adder">
        <button v-if="!showAddCurrency" @click="showAddCurrency = true" class="link-btn">
          + Add Custom Currency
        </button>
        <div v-if="showAddCurrency" class="currency-form">
          <input type="text" v-model="newCurrencyCode" placeholder="Code (e.g., AED)" maxlength="4">
          <input type="text" v-model="newCurrencySymbol" placeholder="Symbol (e.g., AED)">
          <button @click="addCustomCurrency" class="small-btn">Add</button>
          <button @click="showAddCurrency = false" class="small-btn">Cancel</button>
        </div>
      </div>
    </section>

    <!-- === TEMPLATE EDITOR === -->
    <TemplateEditor @template-changed="onTemplateChanged" />

    <!-- === HOLIDAY CALENDAR === -->
    <section class="card">
      <h3>Banking Holidays</h3>
      <p class="section-hint">Mark holidays first. Weekends are auto-excluded. Interest accrues on holidays, but rollover entries only post on working days.</p>
      <HolidayCalendar :holidays="holidays" @toggle-holiday="toggleHoliday" />
    </section>

    <!-- === DATE RANGE SELECTOR === -->
    <section class="card">
      <h3>Period Range</h3>
      <p class="section-hint">Select a start and end date. The app will generate all working days in between as rollover periods.</p>

      <div class="range-selector">
        <div class="form-group">
          <label>Start Date (opening balance date)</label>
          <input type="date" v-model="startDate" :class="{ 'input-error': startDateError }">
          <span v-if="startDateError" class="error-msg">{{ startDateError }}</span>
        </div>

        <div class="form-group">
          <label>End Date</label>
          <input type="date" v-model="endDate" :class="{ 'input-error': endDateError }">
          <span v-if="endDateError" class="error-msg">{{ endDateError }}</span>
        </div>

        <div class="form-group" style="justify-content: flex-end;">
          <button @click="generateWorkingDays" class="generate-btn">Generate Working Days</button>
        </div>
      </div>
    </section>

    <!-- === WORKING DAYS === -->
    <section class="card" v-if="workingDays.length > 0">
      <h3>Working Days ({{ workingDays.length }})</h3>
      <p class="section-hint">These are the rollover dates. Click × on any middle day to delete it — the adjacent periods will merge. The first and last days cannot be deleted.</p>

      <div class="working-days-list">
        <div
          v-for="(day, index) in workingDays"
          :key="day"
          class="working-day-chip"
          :class="{ 'first': index === 0, 'last': index === workingDays.length - 1 }"
        >
          <span class="day-number">{{ index + 1 }}</span>
          <span class="day-date">{{ formatDate(day) }}</span>
          <span class="day-weekday">{{ getWeekdayName(day) }}</span>
          <button
            v-if="index !== 0 && index !== workingDays.length - 1"
            @click="deleteWorkingDay(index)"
            class="day-delete"
            title="Delete this working day (merges adjacent periods)"
          >×</button>
        </div>
      </div>
    </section>

    <!-- === ROLLOVER PERIODS === -->
    <section class="card" v-if="calculatedPeriods.length > 0">
      <h3>Rollover Periods ({{ calculatedPeriods.length }})</h3>
      <p class="section-hint">Enter the interest rate for each period from your bank statement. Opening, interest, and closing balances calculate automatically. Verify closing matches your statement.</p>

      <div class="periods-table-wrap">
        <table class="periods-table">
          <thead>
            <tr>
              <th>#</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Rate (%)</th>
              <th>Opening</th>
              <th>Interest</th>
              <th>Closing</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(period, index) in calculatedPeriods"
              :key="period.fromDate"
              :class="{ active: index === currentPeriodIndex }"
              @click="currentPeriodIndex = index"
            >
              <td>{{ index + 1 }}</td>
              <td>{{ formatDate(period.fromDate) }}</td>
              <td>{{ formatDate(period.toDate) }}</td>
              <td>{{ period.days }}</td>
              <td>
                <input
                  type="number"
                  v-model.number="periodRates[period.fromDate]"
                  step="0.01"
                  class="table-input"
                  placeholder="0"
                  @click.stop
                >
              </td>
              <td class="mono">{{ formatCurrency(period.openingBalance, currencyCode, commaSystem) }}</td>
              <td class="mono highlight">{{ formatCurrency(period.interest, currencyCode, commaSystem) }}</td>
              <td class="mono highlight">{{ formatCurrency(period.closingBalance, currencyCode, commaSystem) }}</td>
              <td>
                <span v-if="period.rateChanged" class="rate-change-badge" title="Rate changes next period — Entry B will be generated">B</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- === NARRATIONS === -->
    <section class="card" v-if="currentPeriod">
      <h3>Narrations — Period {{ currentPeriodIndex + 1 }}</h3>
      <p class="section-hint">Edit narrations below if needed. Changes are preserved per period. If you change inputs above, narrations will regenerate.</p>

      <!-- Entry A: Interest -->
      <div class="narration-block">
        <div class="narration-header">
          <strong>Entry A — Interest Entry</strong>
          <span class="narration-date">{{ formatDate(currentPeriod.toDate) }}</span>
        </div>
        <textarea
          v-model="narrations[currentPeriod.fromDate].A"
          rows="3"
          class="narration-textarea"
        ></textarea>
        <div class="entry-rows">
          <div class="entry-row">
            <span class="dr-cr">Dr.</span>
            <span class="ledger">{{ oldLedgerName(currentPeriod) }}</span>
            <span class="amount">{{ formatCurrency(currentPeriod.interest, currencyCode, commaSystem) }}</span>
          </div>
          <div class="entry-row">
            <span class="dr-cr">Cr.</span>
            <span class="ledger">{{ interestIncomeLedgerName() }}</span>
            <span class="amount">{{ formatCurrency(currentPeriod.interest, currencyCode, commaSystem) }}</span>
          </div>
        </div>
      </div>

      <!-- Entry B: Rollover -->
      <div class="narration-block" v-if="currentPeriod.rateChanged">
        <div class="narration-header">
          <strong>Entry B — Rollover Entry</strong>
          <span class="narration-date">{{ formatDate(currentPeriod.toDate) }}</span>
        </div>
        <textarea
          v-model="narrations[currentPeriod.fromDate].B"
          rows="3"
          class="narration-textarea"
        ></textarea>
        <div class="entry-rows">
          <div class="entry-row">
            <span class="dr-cr">Dr.</span>
            <span class="ledger">{{ newLedgerName(currentPeriod) }}</span>
            <span class="amount">{{ formatCurrency(currentPeriod.closingBalance, currencyCode, commaSystem) }}</span>
          </div>
          <div class="entry-row">
            <span class="dr-cr">Cr.</span>
            <span class="ledger">{{ oldLedgerName(currentPeriod) }}</span>
            <span class="amount">{{ formatCurrency(currentPeriod.closingBalance, currencyCode, commaSystem) }}</span>
          </div>
        </div>
      </div>

      <div v-if="!currentPeriod.rateChanged" class="info-note">
        Entry B (rollover) is not generated for this period because the rate doesn't change in the next period. Only Entry A (interest capitalization) is needed.
      </div>
    </section>

    <!-- === EXPORT === -->
    <section class="card export-section" v-if="calculatedPeriods.length > 0">
      <h3>Export</h3>
      <p class="section-hint">Exports all periods as a single CSV file with all entries.</p>
      <button @click="handleExport" class="export-btn">Export All Periods CSV</button>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import HolidayCalendar from './HolidayCalendar.vue'
import TemplateEditor from './TemplateEditor.vue'
import {
  formatDate, formatDateISO, getNextDate, getDaysBetween,
  isWeekend, formatNumber, formatCurrency, getDenominator,
  calculateInterest, defaultTemplates, defaultLedgerTemplates, fillTemplate,
  exportToCSV, saveToStorage, loadFromStorage
} from '../utils/helpers.js'

// ============================================
// GLOBAL SETTINGS
// ============================================
const bankName = ref('Standard Chartered Bank')
const initialBalance = ref(514858.98)
const commaSystem = ref('international')
const dayCountConvention = ref('360')
const showCalculation = ref(true)

// ============================================
// ACTIVE TEMPLATE (from TemplateEditor)
// ============================================
const activeTemplate = ref({
  narrations: { ...defaultTemplates },
  ledgerNames: { ...defaultLedgerTemplates }
})

function onTemplateChanged(newTemplate) {
  activeTemplate.value = newTemplate
}

// ============================================
// CURRENCY
// ============================================
const builtInCurrencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: 'EUR' },
  { code: 'GBP', symbol: 'GBP' },
  { code: 'INR', symbol: 'Rs' }
]
const customCurrencies = ref(loadFromStorage('customCurrencies', []))
const allCurrencies = computed(() => [...builtInCurrencies, ...customCurrencies.value])
const selectedCurrencyCode = ref('USD')
const selectedCurrency = computed(() =>
  allCurrencies.value.find(c => c.code === selectedCurrencyCode.value) || builtInCurrencies[0]
)
const currencyCode = computed(() => selectedCurrency.value.code)

const showAddCurrency = ref(false)
const newCurrencyCode = ref('')
const newCurrencySymbol = ref('')

function addCustomCurrency() {
  const code = newCurrencyCode.value.trim().toUpperCase()
  const symbol = newCurrencySymbol.value.trim() || code
  if (!code) return
  if (allCurrencies.value.some(c => c.code === code)) {
    alert('Currency code already exists')
    return
  }
  customCurrencies.value.push({ code, symbol })
  saveToStorage('customCurrencies', customCurrencies.value)
  selectedCurrencyCode.value = code
  showAddCurrency.value = false
  newCurrencyCode.value = ''
  newCurrencySymbol.value = ''
}

// ============================================
// HOLIDAYS
// ============================================
const holidays = ref(loadFromStorage('bankingHolidays', []))

function toggleHoliday(dateStr) {
  const index = holidays.value.indexOf(dateStr)
  if (index > -1) {
    holidays.value.splice(index, 1)
  } else {
    holidays.value.push(dateStr)
  }
  holidays.value.sort()
  saveToStorage('bankingHolidays', holidays.value)
}

// ============================================
// DATE RANGE AND WORKING DAYS
// ============================================
const startDate = ref('2026-01-02')
const endDate = ref('2026-01-15')
const workingDays = ref([])

const startDateError = computed(() => {
  if (!startDate.value) return 'Start date is required'
  if (isWeekend(startDate.value)) return 'Start date is a weekend'
  if (holidays.value.includes(formatDateISO(startDate.value)))
    return 'Start date is marked as a holiday'
  return ''
})

const endDateError = computed(() => {
  if (!endDate.value) return 'End date is required'
  if (startDate.value && new Date(endDate.value) <= new Date(startDate.value))
    return 'End date must be after start date'
  return ''
})

function generateWorkingDays() {
  if (startDateError.value || endDateError.value) return

  const days = []
  let current = new Date(startDate.value)
  const end = new Date(endDate.value)

  while (current <= end) {
    const iso = formatDateISO(current)
    if (!isWeekend(current) && !holidays.value.includes(iso)) {
      days.push(iso)
    }
    current.setDate(current.getDate() + 1)
  }

  workingDays.value = days
  currentPeriodIndex.value = 0
}

function deleteWorkingDay(index) {
  if (index === 0 || index === workingDays.value.length - 1) return
  workingDays.value.splice(index, 1)
}

function getWeekdayName(dateStr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(dateStr).getDay()]
}

// ============================================
// PERIOD DATA (keyed by fromDate)
// ============================================
const periodRates = reactive({})
const narrations = reactive({})

// ============================================
// CALCULATED PERIODS (chain logic)
// ============================================
const calculatedPeriods = computed(() => {
  if (workingDays.value.length < 2) return []

  let runningBalance = initialBalance.value
  const result = []

  for (let i = 0; i < workingDays.value.length - 1; i++) {
    const fromDate = workingDays.value[i]
    const toDate = workingDays.value[i + 1]
    const rate = periodRates[fromDate] || 0

    const openingBalance = runningBalance
    const days = getDaysBetween(fromDate, toDate)
    const denominator = getDenominator(dayCountConvention.value, toDate)
    const interest = calculateInterest(openingBalance, rate, days, dayCountConvention.value, toDate)
    const closingBalance = openingBalance + interest

    runningBalance = closingBalance

    const hasNext = i < workingDays.value.length - 2
    const nextRate = hasNext ? (periodRates[toDate] || 0) : null
    const rateChanged = hasNext && rate !== nextRate
    const nextDate = hasNext ? workingDays.value[i + 2] : getNextDate(toDate)

    result.push({
      index: i,
      fromDate,
      toDate,
      rate,
      openingBalance,
      days,
      denominator,
      interest,
      closingBalance,
      hasNext,
      nextRate,
      rateChanged,
      nextDate
    })
  }

  return result
})

const currentPeriodIndex = ref(0)
const currentPeriod = computed(() => calculatedPeriods.value[currentPeriodIndex.value])

// ============================================
// LEDGER NAMES (all from template)
// ============================================
function oldLedgerName(period) {
  return fillTemplate(activeTemplate.value.ledgerNames.oldDeposit, {
    bank: bankName.value,
    oldRate: period.rate
  })
}

function newLedgerName(period) {
  return fillTemplate(activeTemplate.value.ledgerNames.newDeposit, {
    bank: bankName.value,
    newRate: period.nextRate
  })
}

function interestIncomeLedgerName() {
  return fillTemplate(activeTemplate.value.ledgerNames.interestIncome, {
    bank: bankName.value
  })
}

// ============================================
// NARRATION GENERATION
// ============================================
function generateNarrationA(period) {
  const cc = currencyCode.value
  const cs = commaSystem.value

  const values = {
    bank: bankName.value,
    oldRate: period.rate,
    newRate: period.nextRate,
    currency: cc,
    openingBalance: formatNumber(period.openingBalance, cs),
    interest: formatNumber(period.interest, cs),
    closingBalance: formatNumber(period.closingBalance, cs),
    days: period.days,
    openingDate: formatDate(period.fromDate),
    closingDate: formatDate(period.toDate),
    nextDate: formatDate(period.nextDate),
    denominator: period.denominator
  }

  const template = showCalculation.value
    ? activeTemplate.value.narrations.entryAWithCalc
    : activeTemplate.value.narrations.entryA

  return fillTemplate(template, values)
}

function generateNarrationB(period) {
  const cc = currencyCode.value
  const cs = commaSystem.value

  const values = {
    bank: bankName.value,
    oldRate: period.rate,
    newRate: period.nextRate,
    currency: cc,
    openingBalance: formatNumber(period.openingBalance, cs),
    interest: formatNumber(period.interest, cs),
    closingBalance: formatNumber(period.closingBalance, cs),
    days: period.days,
    openingDate: formatDate(period.fromDate),
    closingDate: formatDate(period.toDate),
    nextDate: formatDate(period.nextDate),
    denominator: period.denominator
  }

  return fillTemplate(activeTemplate.value.narrations.entryB, values)
}

// Watcher: regenerate narrations when inputs change
watch(
  [calculatedPeriods, currencyCode, commaSystem, showCalculation, bankName, dayCountConvention, activeTemplate],
  () => {
    calculatedPeriods.value.forEach((period) => {
      if (!narrations[period.fromDate]) {
        narrations[period.fromDate] = { A: '', B: '' }
      }
      if (period.toDate) {
        narrations[period.fromDate].A = generateNarrationA(period)
        narrations[period.fromDate].B = period.rateChanged ? generateNarrationB(period) : ''
      }
    })
  },
  { immediate: true, deep: true }
)

// ============================================
// CSV EXPORT
// ============================================
function handleExport() {
  const rows = []

  calculatedPeriods.value.forEach((period) => {
    if (!period.toDate) return

    const date = formatDate(period.toDate)
    const oldLedger = oldLedgerName(period)
    const interestLedger = interestIncomeLedgerName()
    const narrationA = narrations[period.fromDate]?.A || ''
    const narrationB = narrations[period.fromDate]?.B || ''

    rows.push({
      date,
      ledger: oldLedger,
      debit: period.interest.toFixed(2),
      credit: '',
      narration: narrationA
    })
    rows.push({
      date,
      ledger: interestLedger,
      debit: '',
      credit: period.interest.toFixed(2),
      narration: narrationA
    })

    if (period.rateChanged) {
      const newLedger = newLedgerName(period)
      rows.push({
        date,
        ledger: newLedger,
        debit: period.closingBalance.toFixed(2),
        credit: '',
        narration: narrationB
      })
      rows.push({
        date,
        ledger: oldLedger,
        debit: '',
        credit: period.closingBalance.toFixed(2),
        narration: narrationB
      })
    }
  })

  exportToCSV(rows, 'rollover_all_periods.csv')
}
</script>

<style scoped>
.daily-rollover {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

h2 {
  margin: 0 0 20px 0;
  color: #1a1a1a;
  font-size: 1.4em;
}

h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.15em;
}

.section-hint {
  font-size: 0.8em;
  color: #999;
  margin-bottom: 15px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 0.85em;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95em;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4a90d9;
  box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.15);
}

.form-group input.input-error {
  border-color: #e53935;
}

.error-msg {
  color: #e53935;
  font-size: 0.75em;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding-top: 22px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  cursor: pointer;
}

.currency-adder {
  margin-top: 15px;
}

.link-btn {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  font-size: 0.85em;
  padding: 0;
}

.link-btn:hover {
  text-decoration: underline;
}

.currency-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.currency-form input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  width: 120px;
}

.small-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f8f8;
  cursor: pointer;
  font-size: 0.85em;
}

.small-btn:hover {
  background: #eee;
}

.range-selector {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.range-selector .form-group {
  flex: 1;
  min-width: 180px;
}

.generate-btn {
  padding: 8px 20px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
}

.generate-btn:hover {
  background: #357abd;
}

.working-days-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.working-day-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  font-size: 0.85em;
  position: relative;
}

.working-day-chip.first {
  background: #e3f2fd;
  border-color: #bbdefb;
}

.working-day-chip.last {
  background: #fff3e0;
  border-color: #ffe0b2;
}

.day-number {
  font-weight: 700;
  color: #4a90d9;
  font-size: 0.85em;
}

.day-date {
  color: #333;
  font-weight: 500;
}

.day-weekday {
  color: #999;
  font-size: 0.85em;
}

.day-delete {
  background: none;
  border: none;
  color: #e53935;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0;
  line-height: 1;
  margin-left: 4px;
}

.day-delete:hover {
  color: #c62828;
}

.periods-table-wrap {
  overflow-x: auto;
}

.periods-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
}

.periods-table th {
  text-align: left;
  padding: 10px 8px;
  background: #f5f5f5;
  border-bottom: 2px solid #ddd;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
}

.periods-table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

.periods-table tr {
  cursor: pointer;
}

.periods-table tr:hover {
  background: #f8f9fa;
}

.periods-table tr.active {
  background: #e3f2fd;
}

.periods-table td.mono {
  font-family: 'Courier New', monospace;
  text-align: right;
}

.periods-table td.highlight {
  color: #2e7d32;
  font-weight: 600;
}

.table-input {
  width: 80px;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: inherit;
}

.table-input:focus {
  outline: none;
  border-color: #4a90d9;
}

.rate-change-badge {
  display: inline-block;
  background: #ff9800;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  text-align: center;
  line-height: 18px;
  font-size: 0.75em;
  font-weight: 700;
}

.narration-block {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.narration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.narration-date {
  color: #666;
  font-size: 0.85em;
}

.narration-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
  line-height: 1.5;
}

.narration-textarea:focus {
  outline: none;
  border-color: #4a90d9;
}

.entry-rows {
  margin-top: 12px;
}

.entry-row {
  display: grid;
  grid-template-columns: 35px 1fr auto;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9em;
  align-items: center;
}

.entry-row:last-child {
  border-bottom: none;
}

.dr-cr {
  font-weight: 600;
  color: #666;
}

.entry-row .ledger {
  color: #333;
}

.entry-row .amount {
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

.info-note {
  padding: 10px 15px;
  background: #fff3e0;
  border: 1px solid #ffe0b2;
  border-radius: 4px;
  font-size: 0.85em;
  color: #e65100;
}

.export-section {
  text-align: center;
}

.export-btn {
  background: #2e7d32;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: 600;
}

.export-btn:hover {
  background: #1b5e20;
}
</style>