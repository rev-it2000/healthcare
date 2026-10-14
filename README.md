# ARIA — AI Clinical Triage Agent 🏥

[![Tests](https://img.shields.io/badge/tests-26%2F27%20passing-brightgreen)](./tests/aria.test.js)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![ABDM](https://img.shields.io/badge/ABDM-Certified%20Simulation-cyan)](https://abdm.gov.in)

> **ARIA** (Autonomous Rapid Intake Agent) is an AI-powered **Level 1 Clinical Triage system** that reads patient medical history via a 14-digit **ABHA Medical ID**, enforces a **Privacy Firewall** to protect sensitive health data, and generates structured **Doctor Handoff Reports** — all compliant with DPDPA 2023.

---

## 🚀 Live Demo

👉 **[https://healthcare-three-wheat.vercel.app](https://healthcare-three-wheat.vercel.app)**

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔒 **Privacy Firewall** | Automatically suppresses psychiatric, reproductive & substance abuse records from patient-facing interviews |
| 🆔 **ABHA Medical ID Lookup** | 14-digit ABDM-compliant patient identification |
| 🤖 **AI Triage Interview** | 2–3 focused clinical questions powered by LLM |
| 📋 **Doctor Handoff Report** | Structured 4-section Markdown report with red flags |
| ⚠ **Clinical Correlation Engine** | Surfaces dangerous drug interactions using clinical language only |
| 🛡️ **Privacy Audit Trail** | Full disclosure log showing which records were suppressed vs flagged |

---

## 🏗️ Architecture

```
Browser (Vanilla JS SPA)
│
├── index.html        — All views (Landing, Scan, Chat, Report)
├── style.css         — Dark medical design system
├── app.js            — System Prompt Factory + Privacy Firewall + Chat Engine
├── patients.js       — Simulated ABDM patient database (4 records)
│
└── Express Server (Node.js)
    ├── server.js     — Static file server + /api/health endpoint
    └── .env          — Environment configuration (API keys — gitignored)
```

**API calls are made browser-side** directly to [OpenRouter](https://openrouter.ai) — no server-side proxying needed.

---

## 🔐 Security

- **Content-Security-Policy** meta header restricts resource origins
- **X-Frame-Options: DENY** prevents clickjacking
- **X-Content-Type-Options: nosniff** prevents MIME sniffing
- **Input sanitisation** — all user inputs escape HTML before rendering (`escapeHtml()`)
- **Sensitive data never leaves the system prompt** — the Privacy Firewall operates purely in the LLM context
- **API key stored in `sessionStorage`** only — never committed to source control, never sent to our server

---

## ♿ Accessibility

- Full **ARIA landmark** roles (`role="main"`, `role="banner"`, `role="alert"`)
- **`aria-live="polite"`** on chat messages and scan steps
- **`aria-label`** on all interactive elements
- **Keyboard navigation** — Enter to send, Tab through all controls
- **Skip-to-content link** for screen readers
- High-contrast dark theme with WCAG AA-compliant color ratios

---

## 🧪 Testing

```bash
npm test
```

27 unit tests covering:
- Patient database lookup & validation
- Medical ID formatting
- XSS/HTML escaping (security)
- Report section parsing
- Privacy Firewall system prompt generation
- Input injection attack resistance
- Red flag correlation heuristics

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- OpenRouter API key (free at [openrouter.ai/keys](https://openrouter.ai/keys))

### Installation

```bash
git clone https://github.com/rev-it2000/healthcare.git
cd healthcare
npm install
```

### Running Locally

```bash
node server.js
# → http://localhost:3000
```

### Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

---

## 👥 Demo Patients

| ABHA ID | Patient | Scenario |
|---|---|---|
| `1234 5678 9012 34` | Rahul Sharma, 47M | ⚠ Cardiac Red Flag |
| `9876 5432 1098 76` | Priya Mehta, 31F | 🔒 Privacy Shield Active |
| `1122 3344 5566 77` | Arun Kumar, 29M | ⚠ Drug Contraindication |
| `5566 7788 9900 11` | Meera Nair, 63F | ⚠ Multi-Flag (AF + CHF) |

---

## ⚠️ Disclaimer

This is a **clinical simulation for demonstration purposes only**. No real patient data is processed. All records are entirely fictional. **Not for medical use.**

---

## 📄 License

MIT © ARIA Medical AI Team
