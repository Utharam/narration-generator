<template>
  <div class="app">
    <header>
      <h1>Accounting Narration Generator</h1>
      <p class="subtitle">Rule-based narration generator for recurring transactions</p>
    </header>
    <main>
      <DailyRollover />
    </main>
    <footer>
      <p>Created by Utharam</p>
      <p class="footer-sub">Built for accountants, by an accountant. Runs entirely in your browser. No data leaves your device.</p>
    </footer>
  </div>
</template>

<script setup>
import DailyRollover from './components/DailyRollover.vue'
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 30px;
}

h1 {
  margin: 0;
  color: #1a1a1a;
  font-size: 1.8em;
}

.subtitle {
  color: #666;
  margin: 5px 0 0 0;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
  text-align: center;
  color: #999;
  font-size: 0.85em;
}

footer p {
  margin: 4px 0;
}

footer p:first-child {
  font-weight: 600;
  color: #666;
  font-size: 0.95em;
}

.footer-sub {
  font-size: 0.8em;
}
</style>