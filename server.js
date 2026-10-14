/**
 * ARIA — Clinical Triage AI Backend
 * Express server: static files + security middleware + rate limiting
 * Compatible with local dev and Vercel serverless deployment.
 */
require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security Headers Middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options',        'DENY');
  res.setHeader('Referrer-Policy',        'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',     'camera=(), microphone=(), geolocation=()');
  next();
});

// ── In-Memory Rate Limiter (no external packages) ─────────────────────────────
const RATE_LIMIT = { windowMs: 60_000, maxRequests: 60 };
const _rateMap = new Map();

function rateLimiter(req, res, next) {
  const ip  = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = _rateMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT.windowMs };

  // Reset window if expired
  if (now > rec.resetAt) {
    rec.count   = 0;
    rec.resetAt = now + RATE_LIMIT.windowMs;
  }

  rec.count++;
  _rateMap.set(ip, rec);

  res.setHeader('X-RateLimit-Limit',     RATE_LIMIT.maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT.maxRequests - rec.count));

  if (rec.count > RATE_LIMIT.maxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please wait before retrying.' });
  }
  next();
}

// ── Input Sanitisation Utility ────────────────────────────────────────────────
function sanitiseString(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str
    .slice(0, maxLen)
    .replace(/[<>]/g, '')          // strip HTML brackets
    .trim();
}

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '64kb' }));   // Prevent large payload attacks
app.use(rateLimiter);
app.use(express.static(path.join(__dirname)));

// ── Health Check Endpoint ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:  'ok',
    service: 'ARIA Clinical Triage',
    version: '1.0.0',
    uptime:  process.uptime().toFixed(1) + 's',
  });
});

// ── Catch-all SPA Route ───────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Local Dev Server ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════════╗`);
    console.log(`  ║   ARIA Clinical Triage — Server Ready   ║`);
    console.log(`  ║   http://localhost:${PORT}                  ║`);
    console.log(`  ╚══════════════════════════════════════════╝\n`);
  });
}

// Export for Vercel serverless
module.exports = app;
