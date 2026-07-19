<template>
  <div class="number-to-text">

    <!-- === INPUT === -->
    <section class="card">
      <h2>Number to Text</h2>
      <p class="section-hint">Convert numbers to words for wire transfers, cheques, and payment instructions.</p>

      <div class="input-section">
        <div class="form-group">
          <label>Amount</label>
          <input
            type="number"
            v-model.number="amount"
            step="0.01"
            placeholder="40352.68"
            class="amount-input"
            @input="updatePreview"
          >
        </div>

        <div class="form-group">
          <label>Currency Code</label>
          <input type="text" v-model="currencyCode" placeholder="USD" maxlength="4" @input="updatePreview">
        </div>

        <div class="form-group">
          <label>Currency Name (for suffix format)</label>
          <input type="text" v-model="currencyName" placeholder="US Dollars" @input="updatePreview">
        </div>

        <div class="form-group">
          <label>Fractional Unit Name</label>
          <input type="text" v-model="fractionUnitName" placeholder="Cents" @input="updatePreview">
          <span class="field-hint">Cents, Paise, Pence, Fils, etc.</span>
        </div>
      </div>

      <div class="format-options">
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="useHyphen" @change="updatePreview">
            Use hyphens (Twenty-One)
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="useAnd" @change="updatePreview">
            Use "and" (One Hundred and Twenty)
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="useOnly" @change="updatePreview">
            Add "Only" at end
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="centsAsWords" @change="updatePreview">
            Fraction in words (vs 68/100)
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="indianSystem" @change="updatePreview">
            Indian system (Lakh/Crore)
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="usePrefix" @change="updatePreview">
            Currency code prefix (USD Forty...)
          </label>
        </div>
      </div>
    </section>

    <!-- === PREVIEW === -->
    <section class="card" v-if="previewText">
      <h3>Preview</h3>
      <div class="preview-box">
        <p class="preview-text">{{ previewText }}</p>
      </div>
      <div class="preview-actions">
        <button @click="copyToClipboard" class="copy-btn">{{ copied ? '✓ Copied' : 'Copy to clipboard' }}</button>
      </div>
    </section>

    <!-- === EXAMPLES === -->
    <section class="card">
      <h3>Common Variations</h3>
      <p class="section-hint">Click any example to load it.</p>
      <div class="examples-grid">
        <button @click="loadExample(1)" class="example-btn">
          <span class="example-label">USD Standard</span>
          <span class="example-text">USD Forty Thousand Three Hundred Fifty Two and Cents Sixty Eight Only</span>
        </button>
        <button @click="loadExample(2)" class="example-btn">
          <span class="example-label">USD With hyphens & "and"</span>
          <span class="example-text">USD Forty Thousand Three Hundred and Fifty-Two and Cents Sixty-Eight Only</span>
        </button>
        <button @click="loadExample(3)" class="example-btn">
          <span class="example-label">USD Fraction cents</span>
          <span class="example-text">USD Forty Thousand Three Hundred Fifty Two and 68/100</span>
        </button>
        <button @click="loadExample(4)" class="example-btn">
          <span class="example-label">INR with Paise</span>
          <span class="example-text">INR Four Lakh Three Thousand Five Hundred Fifty Two and Paise Sixty Eight Only</span>
        </button>
        <button @click="loadExample(5)" class="example-btn">
          <span class="example-label">GBP with Pence (suffix format)</span>
          <span class="example-text">Forty Thousand Three Hundred Fifty Two Pound Sterling and Sixty Eight Pence Only</span>
        </button>
        <button @click="loadExample(6)" class="example-btn">
          <span class="example-label">AED with Fils</span>
          <span class="example-text">AED Forty Thousand Three Hundred Fifty Two and Fils Sixty Eight Only</span>
        </button>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { numberToCurrencyText } from '../utils/helpers.js'

const amount = ref(40352.68)
const currencyCode = ref('USD')
const currencyName = ref('US Dollars')
const fractionUnitName = ref('Cents')
const useHyphen = ref(false)
const useAnd = ref(false)
const useOnly = ref(true)
const centsAsWords = ref(true)
const indianSystem = ref(false)
const usePrefix = ref(true)

const previewText = ref('')
const copied = ref(false)

function updatePreview() {
  if (!amount.value && amount.value !== 0) {
    previewText.value = ''
    return
  }
  previewText.value = numberToCurrencyText(amount.value, {
    currencyCode: currencyCode.value,
    currencyName: currencyName.value,
    fractionUnitName: fractionUnitName.value,
    useHyphen: useHyphen.value,
    useAnd: useAnd.value,
    useOnly: useOnly.value,
    centsAsWords: centsAsWords.value,
    indianSystem: indianSystem.value,
    usePrefix: usePrefix.value
  })
  copied.value = false
}

function copyToClipboard() {
  navigator.clipboard.writeText(previewText.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function loadExample(num) {
  switch (num) {
    case 1: // USD Standard
      amount.value = 40352.68
      currencyCode.value = 'USD'
      currencyName.value = 'US Dollars'
      fractionUnitName.value = 'Cents'
      useHyphen.value = false
      useAnd.value = false
      useOnly.value = true
      centsAsWords.value = true
      indianSystem.value = false
      usePrefix.value = true
      break
    case 2: // USD With hyphens & "and"
      amount.value = 40352.68
      currencyCode.value = 'USD'
      currencyName.value = 'US Dollars'
      fractionUnitName.value = 'Cents'
      useHyphen.value = true
      useAnd.value = true
      useOnly.value = true
      centsAsWords.value = true
      indianSystem.value = false
      usePrefix.value = true
      break
    case 3: // USD Fraction cents
      amount.value = 40352.68
      currencyCode.value = 'USD'
      currencyName.value = 'US Dollars'
      fractionUnitName.value = 'Cents'
      useHyphen.value = false
      useAnd.value = false
      useOnly.value = false
      centsAsWords.value = false
      indianSystem.value = false
      usePrefix.value = true
      break
    case 4: // INR with Paise
      amount.value = 403552.68
      currencyCode.value = 'INR'
      currencyName.value = 'Indian Rupees'
      fractionUnitName.value = 'Paise'
      useHyphen.value = false
      useAnd.value = false
      useOnly.value = true
      centsAsWords.value = true
      indianSystem.value = true
      usePrefix.value = true
      break
    case 5: // GBP with Pence (suffix format)
      amount.value = 40352.68
      currencyCode.value = 'GBP'
      currencyName.value = 'Pound Sterling'
      fractionUnitName.value = 'Pence'
      useHyphen.value = false
      useAnd.value = false
      useOnly.value = true
      centsAsWords.value = true
      indianSystem.value = false
      usePrefix.value = false
      break
    case 6: // AED with Fils
      amount.value = 40352.68
      currencyCode.value = 'AED'
      currencyName.value = 'UAE Dirhams'
      fractionUnitName.value = 'Fils'
      useHyphen.value = false
      useAnd.value = false
      useOnly.value = true
      centsAsWords.value = true
      indianSystem.value = false
      usePrefix.value = true
      break
  }
  updatePreview()
}

// Initialize
updatePreview()
</script>

<style scoped>
.number-to-text {
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

.section-hint {
  font-size: 0.85em;
  color: var(--text-light);
  margin-bottom: 20px;
}

.input-section {
  display: grid;
  grid-template-columns: 1fr 100px 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

@media (max-width: 700px) {
  .input-section {
    grid-template-columns: 1fr;
  }
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

.form-group input[type="text"],
.form-group input[type="number"] {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1em;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text);
}

.amount-input {
  font-size: 1.2em !important;
  font-weight: 600;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
}

.field-hint {
  font-size: 0.7em;
  color: var(--text-light);
}

.format-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  padding: 15px;
  background: var(--hover-bg);
  border-radius: 6px;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  cursor: pointer;
  color: var(--text);
}

/* Preview */
.preview-box {
  padding: 25px;
  background: var(--hover-bg);
  border: 1px dashed var(--border);
  border-radius: 8px;
  margin-bottom: 15px;
}

.preview-text {
  margin: 0;
  font-size: 1.15em;
  color: var(--text);
  line-height: 1.6;
  font-weight: 500;
}

.preview-actions {
  display: flex;
  justify-content: flex-end;
}

.copy-btn {
  padding: 8px 20px;
  background: var(--accent-blue);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: #1565c0;
}

/* Examples */
.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.example-btn {
  text-align: left;
  padding: 15px;
  background: var(--hover-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: inherit;
}

.example-btn:hover {
  border-color: var(--accent-blue);
  background: var(--card-bg);
}

.example-label {
  font-size: 0.8em;
  font-weight: 700;
  color: var(--accent-blue);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.example-text {
  font-size: 0.85em;
  color: var(--text-muted);
  line-height: 1.4;
}
</style>