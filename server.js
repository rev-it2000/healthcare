/**
 * ARIA — Clinical Triage AI Backend
 * Serves static files. API calls are made client-side from the browser.
 */
require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

/** Health check — useful for deployment verification */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ARIA Clinical Triage', version: '1.0.0' });
});

/** Catch-all: serve index.html for any unmatched route */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║   ARIA Clinical Triage — Server Ready   ║`);
  console.log(`  ║   http://localhost:${PORT}                  ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});
