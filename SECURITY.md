# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x | ✅ |

## Security Architecture

### Privacy Firewall (DPDPA 2023 / ABDM Compliance)

ARIA enforces a multi-layer Privacy Firewall over **three categories** of sensitive medical data:

| Category | Examples | Protection |
|---|---|---|
| `SENSITIVE-PSYCHIATRIC` | Depression, anxiety, PTSD | Never disclosed; clinical language only if life-threatening correlation |
| `SENSITIVE-REPRODUCTIVE` | IVF, pregnancy, BRCA | Never disclosed under any circumstance |
| `SENSITIVE-SUBSTANCE_ABUSE` | Opioid use disorder, alcohol disorder | Never named; drug contraindications flagged in clinical language only |

**Enforcement mechanism**: Sensitive records are embedded in the LLM system prompt behind a `▓▓▓` barrier with explicit `RULE 1–4` prohibitions. The LLM is instructed to use clinical pharmacological language (e.g., "Naltrexone on board — opioid-class analgesics contraindicated") rather than diagnostic labels.

---

## Client-Side Security Controls

| Control | Implementation |
|---|---|
| **Content-Security-Policy** | Meta header restricts scripts, styles, fonts, and connections to allowlisted origins only |
| **X-Frame-Options: DENY** | Prevents clickjacking attacks |
| **X-Content-Type-Options: nosniff** | Prevents MIME-type sniffing |
| **Referrer-Policy** | `strict-origin-when-cross-origin` |
| **Permissions-Policy** | Camera, microphone, and geolocation disabled |
| **HTML Escaping** | All dynamic content rendered through `escapeHtml()` to prevent XSS |
| **API Key Storage** | `sessionStorage` only — cleared when tab closes, never persisted to `localStorage` or cookies |

---

## Server-Side Security Controls

| Control | Implementation |
|---|---|
| **Rate Limiting** | In-memory Map-based limiter: 60 requests/minute per IP (no external packages) |
| **Payload Size Limit** | Express `json({ limit: '64kb' })` prevents large payload DoS |
| **Security Headers** | Applied via Express middleware on all routes |
| **No API Key on Server** | API calls go directly from browser to OpenRouter — zero server-side key exposure |

---

## Known Limitations

- **Simulated Data Only**: All patient records are fictional. No real PHI is stored or processed.
- **Client-Side Rate Limiting**: The in-memory rate limiter resets on server restart. For production, use Redis-backed limiting (e.g., `rate-limiter-flexible`).
- **No Authentication**: This is a demo system. Production deployment would require ABDM-certified OAuth2/OTP authentication.
- **API Key Prompt**: The API key is entered by the user at runtime and stored only in `sessionStorage`. It is never sent to our server.

---

## Reporting a Vulnerability

This is an educational demonstration project. For questions about the privacy firewall design:

1. Open a GitHub Issue tagged `[SECURITY]`
2. Do NOT include any real patient data in reports

---

## Security Testing

Run the security test suite:

```bash
npm test
```

Tests include:
- XSS payload rejection (`escapeHtml` coverage)
- SQL injection pattern rejection
- Sensitive data leakage prevention (Privacy Firewall tests)
- Input boundary validation (empty, short, long, non-numeric IDs)
