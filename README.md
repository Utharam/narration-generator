# Accounting Narration Generator

A privacy-first, browser-based tool for accountants to generate journal entries and narrations for Daily Roll Over Deposits with floating interest rates. 

Built by an accountant, for accountants. No data ever leaves your browser.

**Live Demo:** https://utharam.github.io/narration-generator/

## Problem Solved

Banks provide daily rollover statements with floating interest rates that change daily. Generating the corresponding journal entries (interest capitalization and deposit rollovers) in accounting software requires manual calculation and repetitive typing. This app automates the math, the date tracking, and the narration generation, while allowing full customization of accounting terminology.

## Features

- **Dynamic Period Generation:** Select a start and end date. The app automatically generates working days, excluding weekends and marked banking holidays.
- **Floating Rate Support:** Enter the specific interest rate for each period. The app calculates daily interest and chains the closing balances automatically.
- **Additions & Withdrawals:** Handle mid-period fund additions or withdrawals at the rollover date.
- **Smart Entry Generation:** Generates Entry A (Interest Capitalization) for every period, and Entry B (Deposit Rollover) *only* when the interest rate changes.
- **Custom Narration Templates:** Create and save custom narration templates using placeholders (e.g., `{bank}`, `{oldRate}`, `{closingBalance}`). Perfect for different firms or clients.
- **Holiday Calendar:** Click-to-toggle holidays saved locally in your browser.
- **CSV Export:** Download all generated entries as a CSV file ready for import or review.
- **100% Private:** All settings, templates, and data are stored in your browser's local storage. Nothing is sent to a server.

## Tech Stack

- Vite
- Vue 3 (Composition API)
- CSS (Scoped)
- LocalStorage for persistence

## Local Development

To run this project locally:

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build

Deployment
This project is configured for GitHub Pages using GitHub Actions.
The vite.config.js uses base: '/narration-generator/' to ensure assets load correctly on the GitHub Pages subpath.

Created by
Utharam