<template>
  <div class="contact">
    <div class="card">
      <h2>Contact & Feedback</h2>
      <p class="contact-intro">
        Found a bug? Have a feature suggestion? Want a new template type added?
        I'd love to hear from you.
      </p>

      <div class="contact-methods">
        <div class="contact-item">
          <div class="contact-icon">✉️</div>
          <div class="contact-details">
            <h4>Email</h4>
            <p>Send your feedback, bug reports, or feature requests:</p>
            <a href="mailto:contactutharam@gmail.com?subject=Accounting Narration Generator - Feedback" class="contact-link">
              contactutharam@gmail.com
            </a>
          </div>
        </div>

        <div class="contact-item">
          <div class="contact-icon">🐛</div>
          <div class="contact-details">
            <h4>Bug Reports</h4>
            <p>When reporting a bug, please include:</p>
            <ul>
              <li>Which tool you were using (Rollover / Prepaid)</li>
              <li>What you expected to happen</li>
              <li>What actually happened</li>
              <li>Your browser and operating system</li>
              <li>Screenshot if possible</li>
            </ul>
          </div>
        </div>

        <div class="contact-item">
          <div class="contact-icon">💡</div>
          <div class="contact-details">
            <h4>Feature Requests</h4>
            <p>Some ideas in the pipeline:</p>
            <ul>
              <li>Depreciation templates (SLM, WDV)</li>
              <li>Accrued interest handling</li>
              <li>More narration rule types</li>
              <li>Import from bank statement CSV</li>
            </ul>
            <p>If you need a specific template or rule, let me know — I can add it.</p>
          </div>
        </div>
      </div>

      <div class="contact-note">
        <strong>Note:</strong> This tool runs entirely in your browser. No data is collected or stored on any server. Your inputs never leave your device.
      </div>
    </div>
  </div>
</template>

<script setup>
// No logic needed — static contact page
</script>

<style scoped>
.contact {
  max-width: 800px;
  margin: 0 auto;
}

.card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 30px;
}

h2 {
  margin: 0 0 15px 0;
  color: #1a1a1a;
  font-size: 1.4em;
}

.contact-intro {
  color: #666;
  font-size: 1em;
  margin-bottom: 30px;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.contact-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.contact-icon {
  font-size: 2em;
}

.contact-details {
  flex: 1;
}

.contact-details h4 {
  margin: 0 0 8px 0;
  color: #1a1a1a;
  font-size: 1.1em;
}

.contact-details p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 0.95em;
}

.contact-details ul {
  margin: 8px 0;
  padding-left: 20px;
  color: #666;
  font-size: 0.9em;
}

.contact-details li {
  margin-bottom: 4px;
}

.contact-link {
  color: #4a90d9;
  text-decoration: none;
  font-weight: 600;
}

.contact-link:hover {
  text-decoration: underline;
}

.contact-hint {
  font-size: 0.8em !important;
  color: #999;
  margin-top: 5px !important;
}

.contact-note {
  margin-top: 30px;
  padding: 15px;
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 6px;
  font-size: 0.9em;
  color: #1565c0;
}

.contact-note strong {
  font-weight: 600;
}
</style>