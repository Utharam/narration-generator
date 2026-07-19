<template>
  <div class="welcome">
    <div class="hero">
      <h2>Accounting Narration Generator</h2>
      <p class="tagline">Automate narration generation for recurring accounting transactions.</p>
    </div>

    <div class="tool-cards">
      <RouterLink to="/rollover" class="tool-card">
        <div class="tool-accent accent-red"></div>
        <div class="tool-body">
          <div class="tool-header">
            <span class="tool-number">01</span>
            <h3>Daily Roll Over Deposit</h3>
          </div>
          <p class="tool-desc">Generate journal entries and narrations for daily rollover deposits with floating interest rates.</p>
          <div class="tool-cta">
            <span>Open tool</span>
            <span class="arrow">→</span>
          </div>
        </div>
      </RouterLink>

      <RouterLink to="/prepaid" class="tool-card">
        <div class="tool-accent accent-green"></div>
          <div class="tool-body">
            <div class="tool-header">
              <span class="tool-number">02</span>
              <h3>Prepaid Expenses</h3>
            </div>
          <p class="tool-desc">Split prepaid expenses across calendar months with automatic proration for partial periods.</p>
          <div class="tool-cta">
            <span>Open tool</span>
            <span class="arrow">→</span>
          </div>
        </div>
      </RouterLink>

      <RouterLink to="/number-to-text" class="tool-card">
        <div class="tool-accent accent-blue"></div>
        <div class="tool-body">
          <div class="tool-header">
            <span class="tool-number">03</span>
            <h3>Number to Text</h3>
          </div>
          <p class="tool-desc">Convert numbers to words for wire transfers and cheques. Supports hyphens, "and", Indian system, and more.</p>
          <div class="tool-cta">
            <span>Open tool</span>
            <span class="arrow">→</span>
          </div>
        </div>
      </RouterLink>

      <RouterLink to="/custom-rule" class="tool-card">
        <div class="tool-accent accent-purple"></div>
        <div class="tool-body">
          <div class="tool-header">
            <span class="tool-number">04</span>
            <h3>Custom Rule Builder</h3>
          </div>
          <p class="tool-desc">Create your own recurring narration generator with custom placeholders and repetition rules.</p>
          <div class="tool-cta">
            <span>Open tool</span>
            <span class="arrow">→</span>
          </div>
        </div>
      </RouterLink>

    </div>
  </div>
</template>

<script setup>
// No logic needed — pure navigation page
</script>

<style scoped>
.welcome {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px 0;
}

/* Hero */
.hero {
  text-align: center;
  margin-bottom: 50px;
  padding: 30px 0;
}

.hero h2 {
  margin: 0 0 12px 0;
  font-size: 2.2em;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.03em;
}

.tagline {
  margin: 0;
  font-size: 1.1em;
  color: var(--text-muted);
  font-weight: 400;
}

/* Tool cards */
.tool-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tool-card {
  display: flex;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: all 0.25s ease;
  box-shadow: 0 1px 3px var(--shadow);
}

.tool-card:hover {
  border-color: var(--border);
  box-shadow: 0 6px 20px var(--shadow-hover);
  transform: translateY(-2px);
}

/* Accent bar */
.tool-accent {
  width: 5px;
  flex-shrink: 0;
}

.accent-red {
  background: var(--accent-red);
}

.accent-green {
  background: var(--accent-green);
}

.accent-blue {
  background: var(--accent-blue);
}

.accent-purple {
  background: #9c27b0;
}

/* Card body */
.tool-body {
  padding: 25px 30px;
  flex: 1;
}

.tool-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.tool-number {
  font-size: 0.85em;
  font-weight: 700;
  color: var(--text-light);
  letter-spacing: 0.05em;
}

.tool-header h3 {
  margin: 0;
  font-size: 1.3em;
  font-weight: 700;
  color: var(--text);
}

.tool-desc {
  margin: 0 0 18px 0;
  color: var(--text-muted);
  font-size: 0.95em;
  line-height: 1.5;
}

.tool-cta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9em;
  font-weight: 600;
  color: var(--accent-blue);
  transition: gap 0.2s;
}

.tool-card:hover .tool-cta {
  gap: 12px;
}

.arrow {
  transition: transform 0.2s;
}

.tool-card:hover .arrow {
  transform: translateX(3px);
}
</style>