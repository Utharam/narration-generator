<template>
  <div class="custom-rule-builder">

    <!-- === SAVED RULES === -->
    <section class="card">
      <h2>Custom Rule Builder</h2>
      <p class="section-hint">Create your own recurring narration generator. Define placeholders, write a template, set repetition rules, and generate narrations for any period. Supports batch mode for multiple entries per period.</p>

      <div class="rule-list" v-if="savedRules.length > 0">
        <div v-for="rule in savedRules" :key="rule.id" class="rule-item">
          <div class="rule-info">
            <span class="rule-name">{{ rule.name }}</span>
            <span class="rule-meta">
              {{ rule.placeholders.length }} placeholders · {{ rule.repetition.frequency }}
              <span v-if="rule.batchRows && rule.batchRows.length > 0"> · {{ rule.batchRows.length }} batch rows</span>
            </span>
          </div>
          <div class="rule-actions">
            <button @click="loadRule(rule)" class="small-btn">Load</button>
            <button @click="deleteRule(rule.id)" class="small-btn danger">Delete</button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>No saved rules yet. Create your first rule below.</p>
      </div>

      <div class="rule-actions-bar">
        <button @click="createNewRule" class="primary-btn">+ Create New Rule</button>
        <button @click="loadExample" class="link-btn">Load Example (Insurance)</button>
        <button @click="loadSalaryExample" class="link-btn">Load Example (Salary Batch)</button>
      </div>
    </section>

    <!-- === RULE EDITOR === -->
    <section class="card" v-if="editingRule">
      <h3>Rule Editor</h3>

      <div class="form-grid">
        <div class="form-group">
          <label>Rule Name</label>
          <input type="text" v-model="editingRule.name" placeholder="Monthly Insurance">
        </div>

        <div class="form-group">
          <label>Number Format</label>
          <select v-model="editingRule.commaSystem">
            <option value="international">International (1,000.00)</option>
            <option value="indian">Indian (1,000.00)</option>
          </select>
        </div>
      </div>

      <!-- Placeholders -->
      <div class="placeholders-section">
        <div class="section-header">
          <h4>Placeholders</h4>
          <button @click="addPlaceholder" class="small-btn">+ Add</button>
        </div>

        <div v-if="editingRule.placeholders.length === 0" class="empty-state">
          <p>No placeholders. Add at least one.</p>
        </div>

        <div v-for="(ph, i) in editingRule.placeholders" :key="ph.id" class="placeholder-row">
          <div class="ph-name">
            <input
              type="text"
              v-model="ph.name"
              placeholder="name"
              :class="{ 'input-error': ph.name && !isNameValid(ph.name, i) }"
            >
            <span class="ph-hint" v-if="ph.name && isNameValid(ph.name, i)">{{ '{' + ph.name + '}' }}</span>
          </div>

          <select v-model="ph.type" @change="onTypeChange(ph)" class="ph-type">
            <option value="date">Date</option>
            <option value="number">Number</option>
            <option value="currency">Currency</option>
            <option value="text">Text</option>
            <option value="calculation">Calculation</option>
          </select>

          <div class="ph-config">
            <select v-if="ph.type === 'date'" v-model="ph.dateFormat">
              <option value="full">Full (31-Jan-2026)</option>
              <option value="monthName">Month short (Jan)</option>
              <option value="monthNameFull">Month full (January)</option>
              <option value="year">Year (2026)</option>
              <option value="iso">ISO (2026-01-31)</option>
              <option value="dayNumber">Day (31)</option>
              <option value="monthNumber">Month no (01)</option>
            </select>

            <input v-if="ph.type === 'number' && !ph.isBatch" type="number" v-model.number="ph.value" step="0.01" placeholder="0">

            <input v-if="ph.type === 'currency'" type="text" v-model="ph.value" placeholder="USD" maxlength="4">

            <input v-if="ph.type === 'text' && !ph.isBatch" type="text" v-model="ph.value" placeholder="Value">

            <template v-if="ph.type === 'calculation'">
              <input type="text" v-model="ph.formula" placeholder="12000/12 or {amount}*{rate}/100" class="formula-input">
              <select v-model="ph.displayMode">
                <option value="result">Result (1,000.00)</option>
                <option value="formula">Formula (12,000/12)</option>
                <option value="both">Both (12,000/12 = 1,000.00)</option>
              </select>
            </template>

            <label v-if="ph.type === 'number' || ph.type === 'text'" class="batch-toggle">
              <input type="checkbox" v-model="ph.isBatch" @change="syncBatchRows">
              <span class="batch-label">Batch</span>
            </label>
          </div>

          <button @click="removePlaceholder(i)" class="remove-btn" title="Remove">×</button>
        </div>
      </div>

      <!-- Batch Data Table -->
      <div class="batch-section" v-if="batchPlaceholders.length > 0">
        <div class="section-header">
          <h4>Batch Data ({{ editingRule.batchRows.length }} rows)</h4>
          <button @click="addBatchRow" class="small-btn">+ Add Row</button>
        </div>
        <p class="section-hint">Each row generates one narration per period. Useful for salary, multiple vendors, or any repeating entries with different values.</p>

        <div class="batch-table-wrap" v-if="editingRule.batchRows.length > 0">
          <table class="batch-table">
            <thead>
              <tr>
                <th class="row-num">#</th>
                <th v-for="ph in batchPlaceholders" :key="ph.id">{{ ph.name }}</th>
                <th class="row-action"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in editingRule.batchRows" :key="rowIndex">
                <td class="row-num">{{ rowIndex + 1 }}</td>
                <td v-for="ph in batchPlaceholders" :key="ph.id">
                  <input
                    :type="ph.type === 'number' ? 'number' : 'text'"
                    v-model="row[ph.name]"
                    :step="ph.type === 'number' ? '0.01' : ''"
                    :placeholder="ph.type === 'number' ? '0' : ''"
                    class="batch-input"
                  >
                </td>
                <td class="row-action">
                  <button @click="removeBatchRow(rowIndex)" class="remove-btn" title="Remove row">×</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
          <p>No batch rows. Click "+ Add Row" to add entries.</p>
        </div>
      </div>

      <!-- Template -->
      <div class="template-section">
        <h4>Narration Template</h4>
        <textarea
          v-model="editingRule.template"
          rows="3"
          placeholder="Being insurance expenses of {month} {year} ({amount})"
        ></textarea>
        <div class="template-hint" v-if="validPlaceholders.length > 0">
          <span class="hint-label">Available:</span>
          <span class="hint-tags">
            <code v-for="ph in validPlaceholders" :key="ph.id">{{ '{' + ph.name + '}' }}</code>
          </span>
        </div>
      </div>

      <!-- Repetition -->
      <div class="repetition-section">
        <h4>Repetition</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Frequency</label>
            <select v-model="editingRule.repetition.frequency">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="biannually">BiAnnually</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div class="form-group">
            <label>Trigger</label>
            <select v-model="editingRule.repetition.trigger">
              <option value="first">First day of period</option>
              <option value="last">Last day of period</option>
            </select>
          </div>

          <div class="form-group">
            <label>Start Date</label>
            <input type="date" v-model="editingRule.repetition.startDate">
          </div>

          <div class="form-group">
            <label>End Date</label>
            <input type="date" v-model="editingRule.repetition.endDate">
          </div>
        </div>
      </div>

      <div class="actions-bar">
        <button @click="saveRule" class="primary-btn">Save Rule</button>
        <button @click="generatePreview" class="secondary-btn">Generate Preview</button>
        <button @click="cancelEdit" class="link-btn">Cancel</button>
      </div>
    </section>

    <!-- === PREVIEW === -->
    <section class="card" v-if="generatedPeriods.length > 0">
      <h3>Generated Narrations ({{ generatedPeriods.length }})</h3>
      <p class="section-hint">Preview of generated narrations. Click export to download as CSV.</p>

      <div class="preview-table-wrap">
        <table class="preview-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th v-if="hasBatch">Row</th>
              <th>Narration</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(period, i) in generatedPeriods" :key="i">
              <td>{{ i + 1 }}</td>
              <td class="date-cell">{{ formatDate(period.date) }}</td>
              <td v-if="hasBatch" class="row-cell">{{ period.rowLabel || '-' }}</td>
              <td class="narration-cell">{{ period.narration }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="export-bar">
        <button @click="exportCSV" class="export-btn">Export CSV</button>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  formatDate, formatNumber, fillTemplate,
  generatePeriodDates, formatDateByType, evaluateFormula, formatFormulaForDisplay,
  saveToStorage, loadFromStorage
} from '../utils/helpers.js'

// ============================================
// SAVED RULES
// ============================================
const savedRules = ref(loadFromStorage('customRules', []))

// ============================================
// EDITING STATE
// ============================================
const editingRule = ref(null)
const generatedPeriods = ref([])

// ============================================
// VALIDATION
// ============================================
function isNameValid(name, currentIndex) {
  if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return false
  if (!editingRule.value) return false
  return !editingRule.value.placeholders.some((p, i) => i !== currentIndex && p.name === name)
}

const validPlaceholders = computed(() => {
  if (!editingRule.value) return []
  return editingRule.value.placeholders.filter((p, i) => p.name && isNameValid(p.name, i))
})

const batchPlaceholders = computed(() => {
  if (!editingRule.value) return []
  return editingRule.value.placeholders.filter(p => p.isBatch && p.name)
})

const hasBatch = computed(() => batchPlaceholders.value.length > 0 && editingRule.value?.batchRows?.length > 0)

// ============================================
// RULE CRUD
// ============================================
function createNewRule() {
  editingRule.value = {
    id: 'rule_' + Date.now(),
    name: '',
    commaSystem: 'international',
    placeholders: [],
    batchRows: [],
    template: '',
    repetition: {
      frequency: 'monthly',
      trigger: 'last',
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    }
  }
  generatedPeriods.value = []
}

function loadExample() {
  editingRule.value = {
    id: 'rule_' + Date.now(),
    name: 'Monthly Insurance',
    commaSystem: 'international',
    placeholders: [
      { id: 'ph_1', name: 'month', type: 'date', dateFormat: 'monthName', isBatch: false },
      { id: 'ph_2', name: 'year', type: 'date', dateFormat: 'year', isBatch: false },
      { id: 'ph_3', name: 'amount', type: 'calculation', formula: '12000/12', displayMode: 'result', isBatch: false }
    ],
    batchRows: [],
    template: 'Being insurance expenses of {month} {year} ({amount})',
    repetition: {
      frequency: 'monthly',
      trigger: 'last',
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    }
  }
  generatedPeriods.value = []
}

function loadSalaryExample() {
  editingRule.value = {
    id: 'rule_' + Date.now(),
    name: 'Monthly Salary Batch',
    commaSystem: 'international',
    placeholders: [
      { id: 'ph_1', name: 'month', type: 'date', dateFormat: 'monthName', isBatch: false },
      { id: 'ph_2', name: 'year', type: 'date', dateFormat: 'year', isBatch: false },
      { id: 'ph_3', name: 'name', type: 'text', isBatch: true },
      { id: 'ph_4', name: 'basic', type: 'number', isBatch: true },
      { id: 'ph_5', name: 'da', type: 'calculation', formula: '{basic}*0.4', displayMode: 'result', isBatch: false }
    ],
    batchRows: [
      { name: 'Ram', basic: 50000 },
      { name: 'Sita', basic: 45000 },
      { name: 'Lakshman', basic: 40000 }
    ],
    template: 'Being Salary for {month} {year} paid to {name} including Basic pay {basic}, DA {da}',
    repetition: {
      frequency: 'monthly',
      trigger: 'last',
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    }
  }
  generatedPeriods.value = []
}

function loadRule(rule) {
  editingRule.value = JSON.parse(JSON.stringify(rule))
  if (!editingRule.value.batchRows) editingRule.value.batchRows = []
  generatedPeriods.value = []
}

function deleteRule(id) {
  if (!confirm('Delete this rule?')) return
  savedRules.value = savedRules.value.filter(r => r.id !== id)
  saveToStorage('customRules', savedRules.value)
}

function saveRule() {
  if (!editingRule.value.name) {
    alert('Please enter a rule name')
    return
  }

  const index = savedRules.value.findIndex(r => r.id === editingRule.value.id)
  if (index > -1) {
    savedRules.value[index] = JSON.parse(JSON.stringify(editingRule.value))
  } else {
    savedRules.value.push(JSON.parse(JSON.stringify(editingRule.value)))
  }
  saveToStorage('customRules', savedRules.value)
}

function cancelEdit() {
  editingRule.value = null
  generatedPeriods.value = []
}

// ============================================
// PLACEHOLDER MANAGEMENT
// ============================================
function addPlaceholder() {
  const id = 'ph_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  editingRule.value.placeholders.push({
    id,
    name: '',
    type: 'text',
    value: '',
    isBatch: false
  })
}

function removePlaceholder(index) {
  const removed = editingRule.value.placeholders[index]
  editingRule.value.placeholders.splice(index, 1)
  if (removed && removed.isBatch) {
    syncBatchRows()
  }
}

function onTypeChange(ph) {
  if (ph.type === 'date') {
    if (!ph.dateFormat) ph.dateFormat = 'full'
    ph.isBatch = false
  } else if (ph.type === 'number') {
    if (ph.value === undefined || ph.value === '') ph.value = 0
  } else if (ph.type === 'currency') {
    if (!ph.value) ph.value = 'USD'
    ph.isBatch = false
  } else if (ph.type === 'text') {
    if (!ph.value) ph.value = ''
  } else if (ph.type === 'calculation') {
    if (!ph.formula) ph.formula = ''
    if (!ph.displayMode) ph.displayMode = 'result'
    ph.isBatch = false
  }
  syncBatchRows()
}

// ============================================
// BATCH ROW MANAGEMENT
// ============================================
function syncBatchRows() {
  if (!editingRule.value) return
  const batchNames = batchPlaceholders.value.map(p => p.name)
  
  editingRule.value.batchRows.forEach(row => {
    batchNames.forEach(name => {
      if (!(name in row)) {
        row[name] = ''
      }
    })
    // Remove keys that are no longer batch placeholders
    Object.keys(row).forEach(key => {
      if (!batchNames.includes(key)) {
        delete row[key]
      }
    })
  })
}

function addBatchRow() {
  const newRow = {}
  batchPlaceholders.value.forEach(p => {
    newRow[p.name] = p.type === 'number' ? 0 : ''
  })
  editingRule.value.batchRows.push(newRow)
}

function removeBatchRow(index) {
  editingRule.value.batchRows.splice(index, 1)
}

// ============================================
// RESOLVE PLACEHOLDERS
// ============================================
function resolvePlaceholders(placeholders, periodDate, commaSystem, batchRow = null) {
  const rawValues = {}
  const displayValues = {}

  // First pass: non-calculations
  placeholders.forEach(p => {
    if (!p.name) return

    if (p.type === 'date') {
      const formatted = formatDateByType(periodDate, p.dateFormat)
      rawValues[p.name] = formatted
      displayValues[p.name] = formatted
    } else if (p.type === 'number') {
      let value
      if (p.isBatch && batchRow) {
        value = Number(batchRow[p.name]) || 0
      } else {
        value = Number(p.value) || 0
      }
      rawValues[p.name] = value
      displayValues[p.name] = formatNumber(value, commaSystem)
    } else if (p.type === 'currency') {
      rawValues[p.name] = p.value
      displayValues[p.name] = p.value
    } else if (p.type === 'text') {
      let value
      if (p.isBatch && batchRow) {
        value = batchRow[p.name] || ''
      } else {
        value = p.value || ''
      }
      rawValues[p.name] = value
      displayValues[p.name] = value
    }
  })

  // Second pass: calculations (can reference earlier placeholders)
  placeholders.forEach(p => {
    if (!p.name) return
    if (p.type === 'calculation') {
      const result = evaluateFormula(p.formula, rawValues)
      if (result !== null) {
        rawValues[p.name] = result
        if (p.displayMode === 'formula') {
          displayValues[p.name] = formatFormulaForDisplay(p.formula, displayValues)
        } else if (p.displayMode === 'both') {
          displayValues[p.name] = `${formatFormulaForDisplay(p.formula, displayValues)} = ${formatNumber(result, commaSystem)}`
        } else {
          displayValues[p.name] = formatNumber(result, commaSystem)
        }
      } else {
        displayValues[p.name] = 'Error'
      }
    }
  })

  return displayValues
}

// ============================================
// GENERATE PREVIEW
// ============================================
function generatePreview() {
  if (!editingRule.value) return
  if (!editingRule.value.template) {
    alert('Please enter a template')
    return
  }

  const { frequency, trigger, startDate, endDate } = editingRule.value.repetition

  if (!startDate || !endDate) {
    alert('Please enter start and end dates')
    return
  }

  if (new Date(endDate) <= new Date(startDate)) {
    alert('End date must be after start date')
    return
  }

  const dates = generatePeriodDates(startDate, endDate, frequency, trigger)
  const periods = []
  const useBatch = hasBatch.value

  if (useBatch) {
    // Batch mode: for each period, for each row
    dates.forEach(date => {
      editingRule.value.batchRows.forEach((row, rowIndex) => {
        const values = resolvePlaceholders(editingRule.value.placeholders, date, editingRule.value.commaSystem, row)
        const narration = fillTemplate(editingRule.value.template, values)
        // Create row label from first text batch placeholder
        const firstTextPh = batchPlaceholders.value.find(p => p.type === 'text')
        const rowLabel = firstTextPh ? row[firstTextPh.name] : `Row ${rowIndex + 1}`
        periods.push({ date, narration, rowLabel })
      })
    })
  } else {
    // Single mode: for each period
    dates.forEach(date => {
      const values = resolvePlaceholders(editingRule.value.placeholders, date, editingRule.value.commaSystem)
      const narration = fillTemplate(editingRule.value.template, values)
      periods.push({ date, narration })
    })
  }

  generatedPeriods.value = periods
}

// ============================================
// CSV EXPORT
// ============================================
function exportCSV() {
  const headers = hasBatch.value ? ['Date', 'Row', 'Narration'] : ['Date', 'Narration']
  const csvLines = [headers.join(',')]

  generatedPeriods.value.forEach(p => {
    if (hasBatch.value) {
      csvLines.push([formatDate(p.date), `"${p.rowLabel || ''}"`, `"${p.narration}"`].join(','))
    } else {
      csvLines.push([formatDate(p.date), `"${p.narration}"`].join(','))
    }
  })

  const csvContent = csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'custom_rule_narrations.csv')
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.custom-rule-builder {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
}

h2 {
  margin: 0 0 10px 0;
  color: var(--text);
  font-size: 1.4em;
  font-weight: 700;
}

h3 {
  margin: 0 0 15px 0;
  color: var(--text);
  font-size: 1.15em;
  font-weight: 700;
}

h4 {
  margin: 0 0 10px 0;
  color: var(--text);
  font-size: 1em;
  font-weight: 600;
}

.section-hint {
  font-size: 0.85em;
  color: var(--text-light);
  margin-bottom: 20px;
}

/* Rule list */
.rule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: var(--hover-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.rule-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rule-name {
  font-weight: 600;
  color: var(--text);
}

.rule-meta {
  font-size: 0.8em;
  color: var(--text-light);
}

.rule-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--text-light);
  font-size: 0.9em;
  background: var(--hover-bg);
  border-radius: 6px;
  margin-bottom: 15px;
}

.rule-actions-bar {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 0.85em;
  font-weight: 600;
  color: var(--text-muted);
}

.form-group input,
.form-group select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.95em;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
}

/* Placeholders */
.placeholders-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.placeholder-row {
  display: grid;
  grid-template-columns: 120px 130px 1fr 30px;
  gap: 10px;
  align-items: center;
  padding: 10px;
  background: var(--hover-bg);
  border-radius: 6px;
  margin-bottom: 8px;
}

.ph-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ph-name input {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.9em;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text);
}

.ph-hint {
  font-size: 0.75em;
  color: var(--accent-blue);
  font-family: 'Courier New', monospace;
}

.ph-type {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.9em;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text);
}

.ph-config {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ph-config input,
.ph-config select {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.9em;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text);
}

.ph-config .formula-input {
  flex: 1;
}

.ph-config input:focus,
.ph-config select:focus {
  outline: none;
  border-color: var(--accent-blue);
}

.batch-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8em;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
}

.batch-toggle input {
  margin: 0;
}

.batch-label {
  font-weight: 600;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--accent-red);
  cursor: pointer;
  font-size: 1.3em;
  padding: 0;
  line-height: 1;
}

.remove-btn:hover {
  color: #c62828;
}

/* Batch table */
.batch-section {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--hover-bg);
  border-radius: 6px;
  border: 1px solid var(--border);
}

.batch-section .section-header {
  margin-bottom: 8px;
}

.batch-section .section-hint {
  margin-bottom: 12px;
  font-size: 0.8em;
}

.batch-table-wrap {
  overflow-x: auto;
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
  background: var(--card-bg);
  border-radius: 4px;
  overflow: hidden;
}

.batch-table th {
  padding: 8px 10px;
  background: var(--hover-bg);
  border-bottom: 2px solid var(--border);
  text-align: left;
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.85em;
}

.batch-table td {
  padding: 4px;
  border-bottom: 1px solid var(--border-light);
}

.batch-table .row-num {
  width: 40px;
  text-align: center;
  color: var(--text-light);
  font-weight: 600;
}

.batch-table .row-action {
  width: 40px;
  text-align: center;
}

.batch-input {
  width: 100%;
  padding: 6px 8px !important;
  border: 1px solid var(--border) !important;
  border-radius: 3px !important;
  font-size: 0.9em;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text);
}

.batch-input:focus {
  outline: none;
  border-color: var(--accent-blue) !important;
}

/* Template */
.template-section {
  margin-bottom: 20px;
}

.template-section textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.95em;
  font-family: 'Courier New', monospace;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.5;
  background: var(--input-bg);
  color: var(--text);
}

.template-section textarea:focus {
  outline: none;
  border-color: var(--accent-blue);
}

.template-hint {
  margin-top: 8px;
  font-size: 0.85em;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hint-label {
  font-weight: 600;
}

.hint-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.hint-tags code {
  background: var(--hover-bg);
  color: var(--accent-blue);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

/* Repetition */
.repetition-section {
  margin-bottom: 20px;
}

.repetition-section .form-grid {
  margin-bottom: 0;
}

/* Buttons */
.actions-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.primary-btn {
  padding: 10px 24px;
  background: var(--accent-blue);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
}

.primary-btn:hover {
  background: #1565c0;
}

.secondary-btn {
  padding: 10px 24px;
  background: var(--accent-green);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
}

.secondary-btn:hover {
  background: #1b5e20;
}

.small-btn {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text);
  cursor: pointer;
  font-size: 0.85em;
}

.small-btn:hover {
  background: var(--hover-bg);
}

.small-btn.danger {
  color: var(--accent-red);
}

.small-btn.danger:hover {
  background: #ffebee;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent-blue);
  cursor: pointer;
  font-size: 0.9em;
  padding: 0;
}

.link-btn:hover {
  text-decoration: underline;
}

/* Preview */
.preview-table-wrap {
  overflow-x: auto;
  margin-bottom: 15px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.preview-table th {
  text-align: left;
  padding: 10px 12px;
  background: var(--hover-bg);
  border-bottom: 2px solid var(--border);
  font-weight: 600;
  color: var(--text-muted);
}

.preview-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-light);
}

.preview-table tr:hover {
  background: var(--hover-bg);
}

.date-cell {
  white-space: nowrap;
  color: var(--text-muted);
}

.row-cell {
  white-space: nowrap;
  color: var(--text-muted);
  font-style: italic;
}

.narration-cell {
  color: var(--text);
}

.export-bar {
  text-align: right;
}

.export-btn {
  padding: 10px 24px;
  background: var(--accent-green);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
}

.export-btn:hover {
  background: #1b5e20;
}

/* Validation */
.input-error {
  border-color: var(--accent-red) !important;
}

/* Responsive */
@media (max-width: 700px) {
  .placeholder-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .ph-config {
    flex-direction: column;
    align-items: stretch;
  }

  .batch-toggle {
    align-self: flex-start;
  }
}
</style>