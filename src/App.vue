<template>
  <div class="app">
    <header>
      <div class="header-left">
        <h1>Accounting Narration Generator</h1>
        <p class="subtitle">Automate narration generation for recurring accounting transactions</p>
      </div>
      <button @click="toggleTheme" class="theme-toggle" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
        <span class="theme-icon">{{ isDark ? '☀' : '☾' }}</span>
      </button>
    </header>

    <nav class="main-nav">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/rollover">Daily Rollover</RouterLink>
      <RouterLink to="/prepaid">Prepaid Expenses</RouterLink>
      <RouterLink to="/number-to-text">Number to Text</RouterLink>
      <RouterLink to="/custom-rule">Custom Rule</RouterLink>
      <RouterLink to="/contact">Contact</RouterLink>
    </nav>

    <main>
      <RouterView />
    </main>

    <footer>
      <p>Created by Utharam</p>
      <p class="footer-sub">Built for accountants, by an accountant. Runs entirely in your browser. No data leaves your device.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})
</script>

<style scoped>
.app {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  flex: 1;
}

h1 {
  margin: 0;
  color: var(--text);
  font-size: 1.8em;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subtitle {
  color: var(--text-muted);
  margin: 5px 0 0 0;
  font-size: 0.95em;
}

.theme-toggle {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.theme-toggle:hover {
  border-color: var(--accent-blue);
  transform: scale(1.05);
}

.theme-icon {
  font-size: 1.3em;
}

.main-nav {
  display: flex;
  gap: 0;
  margin-bottom: 25px;
  border-bottom: 2px solid var(--border);
}

.main-nav a {
  padding: 10px 20px;
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.95em;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.main-nav a:hover {
  color: var(--accent-blue);
}

.main-nav a.router-link-active {
  color: var(--accent-blue);
  border-bottom-color: var(--accent-blue);
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  text-align: center;
  color: var(--text-light);
  font-size: 0.85em;
}

footer p {
  margin: 4px 0;
}

footer p:first-child {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.95em;
}

.footer-sub {
  font-size: 0.8em;
}
</style>