<template>
  <div class="template-editor">
    <div class="template-header">
      <h3>Narration & Ledger Templates</h3>
      <button @click="showEditor = !showEditor" class="toggle-btn">
        {{ showEditor ? 'Collapse ▲' : 'Expand ▼' }}
      </button>
    </div>

    <div v-if="showEditor" class="editor-body">

      <!-- Template selector -->
      <div class="template-selector">
        <div class="form-group">
          <label>Active Template</label>
          <select v-model="selectedTemplateId" @change="onTemplateChange">
            <option value="default">Default (read-only)</option>
            <option v-for="t in customTemplates" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>
        <button @click="createNewTemplate" class="new-btn">+ New Template</button>
      </div>

      <!-- Default template: read-only preview -->
      <div v-if="selectedTemplateId === 'default'" class="default-preview">
        <p class="preview-hint">This is the built-in default. Create a custom template to edit.</p>

        <div class="template-section">
          <h4>Entry A — Interest</h4>
          <pre>{{ defaultTemplate.narrations.entryA }}</pre>
        </div>
        <div class="template-section">
          <h4>Entry A — With Calculation</h4>
          <pre>{{ defaultTemplate.narrations.entryAWithCalc }}</pre>
        </div>
        <div class="template-section">
          <h4>Entry B — Rollover</h4>
          <pre>{{ defaultTemplate.narrations.entryB }}</pre>
        </div>
        <div class="template-section">
          <h4>Ledger Names</h4>
          <pre>Old Deposit:   {{ defaultTemplate.ledgerNames.oldDeposit }}
New Deposit:   {{ defaultTemplate.ledgerNames.newDeposit }}
Interest Inc:  {{ defaultTemplate.ledgerNames.interestIncome }}</pre>
        </div>
      </div>

      <!-- Custom template: editable -->
      <div v-else class="custom-editor">
        <div class="template-name-row">
          <div class="form-group">
            <label>Template Name</label>
            <input type="text" v-model="editingTemplate.name" placeholder="SCB Format">
          </div>
        </div>

        <div class="template-section">
          <label>Entry A — Interest Narration</label>
          <textarea v-model="editingTemplate.narrations.entryA" rows="3"></textarea>
        </div>

        <div class="template-section">
          <label>Entry A — With Calculation</label>
          <textarea v-model="editingTemplate.narrations.entryAWithCalc" rows="3"></textarea>
        </div>

        <div class="template-section">
          <label>Entry B — Rollover Narration</label>
          <textarea v-model="editingTemplate.narrations.entryB" rows="3"></textarea>
        </div>

        <div class="ledger-section">
          <h4>Ledger Name Templates</h4>
          <div class="form-group">
            <label>Old Deposit Ledger</label>
            <input type="text" v-model="editingTemplate.ledgerNames.oldDeposit">
          </div>
          <div class="form-group">
            <label>New Deposit Ledger</label>
            <input type="text" v-model="editingTemplate.ledgerNames.newDeposit">
          </div>
          <div class="form-group">
            <label>Interest Income Ledger</label>
            <input type="text" v-model="editingTemplate.ledgerNames.interestIncome">
          </div>
        </div>

        <div class="template-actions">
          <button @click="saveTemplate" class="save-btn">Save Template</button>
          <button @click="deleteTemplate" class="delete-btn">Delete Template</button>
        </div>
      </div>

      <!-- Placeholders reference -->
      <div class="placeholders-reference">
        <h4 @click="showPlaceholders = !showPlaceholders" class="clickable-header">
          Available Placeholders {{ showPlaceholders ? '▲' : '▼' }}
        </h4>
        <div v-if="showPlaceholders" class="placeholder-list">
          <div class="placeholder-item">
            <code>{bank}</code>
            <span>Bank name (e.g., Standard Chartered Bank)</span>
          </div>
          <div class="placeholder-item">
            <code>{oldRate}</code>
            <span>Current period rate (e.g., 3.51)</span>
          </div>
          <div class="placeholder-item">
            <code>{newRate}</code>
            <span>Next period rate (e.g., 3.67)</span>
          </div>
          <div class="placeholder-item">
            <code>{currency}</code>
            <span>Currency code (e.g., USD)</span>
          </div>
          <div class="placeholder-item">
            <code>{openingBalance}</code>
            <span>Opening balance, formatted with commas</span>
          </div>
          <div class="placeholder-item">
            <code>{effectiveOpening}</code>
            <span>Opening + additions - withdrawals</span>
          </div>
          <div class="placeholder-item">
            <code>{interest}</code>
            <span>Interest amount, formatted</span>
          </div>
          <div class="placeholder-item">
            <code>{closingBalance}</code>
            <span>Closing balance, formatted</span>
          </div>
          <div class="placeholder-item">
            <code>{days}</code>
            <span>Number of days in period</span>
          </div>
          <div class="placeholder-item">
            <code>{openingDate}</code>
            <span>Period start date (e.g., 02-Jan-2026)</span>
          </div>
          <div class="placeholder-item">
            <code>{closingDate}</code>
            <span>Period end date (e.g., 05-Jan-2026)</span>
          </div>
          <div class="placeholder-item">
            <code>{nextDate}</code>
            <span>Next period start date</span>
          </div>
          <div class="placeholder-item">
            <code>{denominator}</code>
            <span>Day count base (360, 365, or 366)</span>
          </div>
          <div class="placeholder-item">
            <code>{addition}</code>
            <span>Addition amount, formatted (if any)</span>
          </div>
          <div class="placeholder-item">
            <code>{withdrawal}</code>
            <span>Withdrawal amount, formatted (if any)</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { defaultTemplates, defaultLedgerTemplates, saveToStorage, loadFromStorage } from '../utils/helpers.js'

const emit = defineEmits(['template-changed'])

// The default template (read-only)
const defaultTemplate = {
  id: 'default',
  name: 'Default',
  isDefault: true,
  narrations: { ...defaultTemplates },
  ledgerNames: { ...defaultLedgerTemplates }
}

// Custom templates from localStorage
const customTemplates = ref(loadFromStorage('customNarrationTemplates', []))

// Currently selected template
const selectedTemplateId = ref('default')

// The template being edited (copy of selected custom template)
const editingTemplate = ref(null)

// UI state
const showEditor = ref(false)
const showPlaceholders = ref(false)

// The active template object (what the parent should use)
const activeTemplate = computed(() => {
  if (selectedTemplateId.value === 'default') {
    return defaultTemplate
  }
  return customTemplates.value.find(t => t.id === selectedTemplateId.value) || defaultTemplate
})

// Emit the active template whenever it changes
watch(activeTemplate, (newTemplate) => {
  emit('template-changed', newTemplate)
}, { immediate: true, deep: true })

// Also emit when editing live (so narrations update as user types)
watch(editingTemplate, (newVal) => {
  if (newVal && selectedTemplateId.value !== 'default') {
    emit('template-changed', newVal)
  }
}, { deep: true })

// Handle template selection change
function onTemplateChange() {
  if (selectedTemplateId.value === 'default') {
    editingTemplate.value = null
    emit('template-changed', defaultTemplate)
  } else {
    const found = customTemplates.value.find(t => t.id === selectedTemplateId.value)
    if (found) {
      // Deep copy so edits don't mutate the stored version until saved
      editingTemplate.value = JSON.parse(JSON.stringify(found))
      emit('template-changed', editingTemplate.value)
    }
  }
}

// Create a new custom template (starts as copy of default)
function createNewTemplate() {
  const newId = 'custom_' + Date.now()
  const newTemplate = {
    id: newId,
    name: 'New Template',
    isDefault: false,
    narrations: JSON.parse(JSON.stringify(defaultTemplate.narrations)),
    ledgerNames: JSON.parse(JSON.stringify(defaultTemplate.ledgerNames))
  }
  customTemplates.value.push(newTemplate)
  saveToStorage('customNarrationTemplates', customTemplates.value)
  selectedTemplateId.value = newId
  editingTemplate.value = JSON.parse(JSON.stringify(newTemplate))
  emit('template-changed', editingTemplate.value)
}

// Save the currently edited template to localStorage
function saveTemplate() {
  if (!editingTemplate.value) return
  const index = customTemplates.value.findIndex(t => t.id === editingTemplate.value.id)
  if (index > -1) {
    customTemplates.value[index] = JSON.parse(JSON.stringify(editingTemplate.value))
    saveToStorage('customNarrationTemplates', customTemplates.value)
    // Emit the saved version
    emit('template-changed', customTemplates.value[index])
  }
}

// Delete the currently selected custom template
function deleteTemplate() {
  if (!editingTemplate.value) return
  if (!confirm(`Delete template "${editingTemplate.value.name}"?`)) return

  const index = customTemplates.value.findIndex(t => t.id === editingTemplate.value.id)
  if (index > -1) {
    customTemplates.value.splice(index, 1)
    saveToStorage('customNarrationTemplates', customTemplates.value)
  }
  selectedTemplateId.value = 'default'
  editingTemplate.value = null
  emit('template-changed', defaultTemplate)
}
</script>

<style scoped>
.template-editor {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.15em;
}

.toggle-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 15px;
  cursor: pointer;
  font-size: 0.85em;
}

.toggle-btn:hover {
  background: #e0e0e0;
}

.editor-body {
  margin-top: 20px;
}

.template-selector {
  display: flex;
  gap: 15px;
  align-items: flex-end;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.template-selector .form-group {
  flex: 1;
  min-width: 200px;
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

.new-btn {
  padding: 8px 16px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 600;
  white-space: nowrap;
}

.new-btn:hover {
  background: #357abd;
}

/* Default preview */
.default-preview {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
}

.preview-hint {
  font-size: 0.85em;
  color: #999;
  margin-bottom: 15px;
}

.template-section {
  margin-bottom: 15px;
}

.template-section h4 {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  color: #555;
}

.template-section label {
  display: block;
  font-size: 0.85em;
  font-weight: 600;
  color: #555;
  margin-bottom: 5px;
}

.template-section pre {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  font-size: 0.85em;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  color: #333;
  margin: 0;
}

.template-section textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85em;
  resize: vertical;
  font-family: 'Courier New', monospace;
  box-sizing: border-box;
  line-height: 1.5;
}

.template-section textarea:focus {
  outline: none;
  border-color: #4a90d9;
}

.template-section input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Courier New', monospace;
  box-sizing: border-box;
}

.template-section input:focus {
  outline: none;
  border-color: #4a90d9;
}

/* Custom editor */
.custom-editor {
  background: #fffde7;
  border: 1px solid #fff9c4;
  border-radius: 6px;
  padding: 15px;
}

.template-name-row {
  margin-bottom: 15px;
}

.template-name-row .form-group {
  max-width: 300px;
}

.ledger-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.ledger-section h4 {
  margin: 0 0 10px 0;
  font-size: 0.9em;
  color: #555;
}

.ledger-section .form-group {
  margin-bottom: 10px;
}

.template-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.save-btn {
  padding: 8px 20px;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
}

.save-btn:hover {
  background: #1b5e20;
}

.delete-btn {
  padding: 8px 20px;
  background: #e53935;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
}

.delete-btn:hover {
  background: #c62828;
}

/* Placeholders */
.placeholders-reference {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.clickable-header {
  cursor: pointer;
  margin: 0;
  font-size: 0.9em;
  color: #555;
  user-select: none;
}

.clickable-header:hover {
  color: #4a90d9;
}

.placeholder-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.placeholder-item {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 0.8em;
  padding: 5px 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.placeholder-item code {
  background: #e3f2fd;
  color: #1565c0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  white-space: nowrap;
}

.placeholder-item span {
  color: #666;
}
</style>