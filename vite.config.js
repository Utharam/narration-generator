import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Change 'narration-generator' to your GitHub repo name
  base: '/narration-generator/',
  plugins: [vue()]
})