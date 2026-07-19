<template>
  <div class="prepaid-expenses">

    <!-- === GLOBAL SETTINGS === -->
    <section class="card">
      <h2>Prepaid Expenses</h2>

      <div class="form-grid">
        <div class="form-group">
          <label>Description</label>
          <input type="text" v-model="description" placeholder="Insurance">
        </div>

        <div class="form-group">
          <label>Total Amount</label>
          <input type="number" v-model.number="totalAmount" step="0.01" placeholder="12000">
        </div>

        <div class="form-group">
          <label>Start Date</label>
          <input type="date" v-model="startDate" :class="{ 'input-error': startDateError }">
          <span v-if="startDateError" class="error-msg">{{ startDateError }}</span>
        </div>

        <div class="form-group">
          <label>End Date</label>
          <input type="date" v-model="endDate" :class="{ 'input-error': endDateError }">
          <span v-if="endDateError" class="error-msg">{{ endDateError }}</span>
        </div>

        <div class="form-group">
          <label>Number of Months</label>
          <input type="number" v-model.number="months" step="1" min="1">
          <span class="field-hint">Auto-calculated from dates — override if needed</span>
        </div>

        <div class="form-group">
          <label>Expense Ledger</label>
          <input type="text" v-model="expenseLedger" placeholder="Insurance Expense">
        </div>

        <div class="form-group">
          <label>Prepaid Ledger</label>
          <input type="text" v-model="prepaidLedger" placeholder="Prepaid Insurance">
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
      </div>
    </section>

    <!-- === TEMPLATE EDITOR === -->
    <TemplateEditor template-type="prepaid" @template-changed="onTemplateChanged" />

    <!-- === PERIODS TABLE === -->
    <section class="card" v-if="calculatedPeriods.length > 0">
      <h3>Periods ({{ calculatedPeriods.length }})</h3>
      <p class="section-hint">Auto-split by calendar months. Full months get {{ formatNumber(monthlyAmount, commaSystem) }} each. Partial periods split one month's worth proportionally.</p>

      <div class="periods-table-wrap">
        <table class="periods-table">
          <thead>
            <tr>
              <th>#</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Type</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(period, index) in calculatedPeriods"
              :key="period.start"
              :class="{ active: index === currentPeriodIndex }"
              @click="currentPeriodIndex = index"
            >
              <td>{{ index + 1 }}</td>
              <td>{{ formatDate(period.start) }}</td>
              <td>{{ formatDate(period.end) }}</td>
              <td>{{ period.days }}</td>
              <td>
                <span :class="['type-badge', period.isFullMonth ? 'full' : 'partial']">
                  {{ period.isFullMonth ? 'Full' : 'Partial' }}
                </span>
              </td>
              <td class="mono highlight">{{ formatCurrency(period.amount, currencyCode, commaSystem) }}</td>
              <td>
                <span v-if="!period.isFullMonth" class="partial-badge" title="Partial period — prorated calculation">
                  P
                </span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; font-weight: 600;">Total:</td>
              <td class="mono highlight">{{ formatCurrency(totalCalculated, currencyCode, commaSystem) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-if="Math.abs(totalCalculated - totalAmount) > 0.01" class="warning-note">
        ⚠ Total of calculated periods ({{ formatCurrency(totalCalculated, currencyCode, commaSystem) }}) doesn't match contract amount ({{ formatCurrency(totalAmount, currencyCode, commaSystem) }}). Check the number of months.
      </div>
    </section>

    <!-- === NARRATIONS === -->
    <section class="card" v-if="currentPeriod">
      <h3>Narration — Period {{ currentPeriodIndex + 1 }}</h3>
      <p class="section-hint">Edit the narration below if needed. Changes are preserved per period. If you change inputs above, narrations will regenerate.</p>

      <div class="narration-block">
        <div class="narration-header">
          <strong>Prepaid Expense Entry</strong>
          <span class="narration-date">{{ formatDate(currentPeriod.end) }}</span>
        </div>
        <textarea
          v-model="narrations[currentPeriod.start]"
          rows="3"
          class="narration-textarea"
        ></textarea>
        <div class="entry-rows">
          <div class="entry-row">
            <span class="dr-cr">Dr.</span>
            <span class="ledger">{{ expenseLedger }}</span>
            <span class="amount">{{ formatCurrency(currentPeriod.amount, currencyCode, commaSystem) }}</span>
          </div>
          <div class="entry-row">
            <span class="dr-cr">Cr.</span>
            <span class="ledger">{{ prepaidLedger }}</span>
            <span class="amount">{{ formatCurrency(currentPeriod.amount, currencyCode, commaSystem) }}</span>
          </div>
        </div>
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
import TemplateEditor from './TemplateEditor.vue'
import {
  formatDate, formatDateISO, formatNumber, formatCurrency,
  getMonthName, calculateMonths, splitPrepaidPeriods,
  calculatePrepaidAmount, defaultPrepaidTemplates, fillTemplate,
  exportToCSV, saveToStorage, loadFromStorage
} from '../utils/helpers.js'

// ============================================
// ACTIVE TEMPLATE (from TemplateEditor)
// ============================================
const activeTemplate = ref({
  narrations: { ...defaultPrepaidTemplates }
})

function onTemplateChanged(newTemplate) {
  activeTemplate.value = newTemplate
}

// ============================================
// GLOBAL SETTINGS
// ============================================
const description = ref('Insurance')
const totalAmount = ref(12000)
const startDate = ref('2026-01-14')
const endDate = ref('2027-01-13')
const months = ref(12)
const expenseLedger = ref('Insurance Expense')
const prepaidLedger = ref('Prepaid Insurance')
const commaSystem = ref('international')

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

// ============================================
// VALIDATION
// ============================================
const startDateError = computed(() => {
  if (!startDate.value) return 'Start date is required'
  return ''
})

const endDateError = computed(() => {
  if (!endDate.value) return 'End date is required'
  if (startDate.value && new Date(endDate.value) <= new Date(startDate.value))
    return 'End date must be after start date'
  return ''
})

// ============================================
// AUTO-CALCULATE MONTHS WHEN DATES CHANGE
// ============================================
watch([startDate, endDate], () => {
  if (startDate.value && endDate.value && !endDateError.value) {
    months.value = calculateMonths(startDate.value, endDate.value)
  }
}, { immediate: true })

// ============================================
// CALCULATED PERIODS
// ============================================
const calculatedPeriods = computed(() => {
  if (startDateError.value || endDateError.value || !months.value || months.value < 1) return []

  const rawPeriods = splitPrepaidPeriods(startDate.value, endDate.value)

  return rawPeriods.map(period => ({
    ...period,
    amount: calculatePrepaidAmount(totalAmount.value, months.value, period, rawPeriods)
  }))
})

const monthlyAmount = computed(() => {
  return months.value > 0 ? totalAmount.value / months.value : 0
})

const totalCalculated = computed(() => {
  return calculatedPeriods.value.reduce((sum, p) => sum + p.amount, 0)
})

const currentPeriodIndex = ref(0)
const currentPeriod = computed(() => calculatedPeriods.value[currentPeriodIndex.value])

// ============================================
// NARRATIONS
// ============================================
const narrations = reactive({})

function generateNarration(period) {
  const cs = commaSystem.value
  const partialPeriods = calculatedPeriods.value.filter(p => !p.isFullMonth)
  const totalPartialDays = partialPeriods.reduce((sum, p) => sum + p.days, 0)

  const values = {
    description: description.value,
    monthName: getMonthName(period.start),
    year: new Date(period.start).getFullYear(),
    periodStart: formatDate(period.start),
    periodEnd: formatDate(period.end),
    startDate: formatDate(startDate.value),
    endDate: formatDate(endDate.value),
    totalAmount: formatNumber(totalAmount.value, cs),
    months: months.value,
    monthlyAmount: formatNumber(monthlyAmount.value, cs),
    daysInPeriod: period.days,
    totalPartialDays,
    expenseLedger: expenseLedger.value,
    prepaidLedger: prepaidLedger.value,
    amount: formatNumber(period.amount, cs)
  }

  const template = period.isFullMonth
    ? activeTemplate.value.narrations.fullMonth
    : activeTemplate.value.narrations.partialMonth

  return fillTemplate(template, values)
}

// Watcher: regenerate narrations when inputs change
watch(
  [calculatedPeriods, currencyCode, commaSystem, description, totalAmount, months,
   expenseLedger, prepaidLedger, startDate, endDate, activeTemplate],
  () => {
    calculatedPeriods.value.forEach((period) => {
      narrations[period.start] = generateNarration(period)
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
    const date = formatDate(period.end)
    const narration = narrations[period.start] || ''
    const amount = period.amount.toFixed(2)

    rows.push({
      date,
      ledger: expenseLedger.value,
      debit: amount,
      credit: '',
      narration
    })

    rows.push({
      date,
      ledger: prepaidLedger.value,
      debit: '',
      credit: amount,
      narration
    })
  })

  exportToCSV(rows, 'prepaid_expenses.csv')
}
</script>

<style scoped>
.prepaid-expenses {
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

.field-hint {
  font-size: 0.7em;
  color: #999;
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

.periods-table tfoot td {
  border-top: 2px solid #ddd;
  border-bottom: none;
  padding-top: 10px;
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

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.8em;
  font-weight: 600;
}

.type-badge.full {
  background: #e8f5e9;
  color: #2e7d32;
}

.type-badge.partial {
  background: #fff3e0;
  color: #e65100;
}

.partial-badge {
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

.warning-note {
  margin-top: 15px;
  padding: 10px 15px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  font-size: 0.85em;
  color: #c62828;
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