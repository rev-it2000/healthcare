// app-module.js — CommonJS export of pure utility functions for testing
const { getPatientById } = require('./patients-module');

function formatMedId(id) {
  return id.replace(/(\d{4})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Parses a Doctor Handoff Report markdown string into a sections object.
 * Uses split-on-### for reliable cross-platform parsing.
 * @param {string} raw - Raw markdown report string
 * @returns {Object} Map of section titles to body text
 */
function parseReportSections(raw) {
  const sections = {};
  if (!raw || !raw.trim()) return sections;
  // Split on ### headers — works cross-platform (CRLF/LF)
  const parts = raw.split(/###\s+/);
  parts.slice(1).forEach(part => {
    const newlineIdx = part.search(/[\r\n]/);
    if (newlineIdx === -1) return;
    const key  = part.slice(0, newlineIdx).trim();
    const body = part.slice(newlineIdx).trim();
    if (key) sections[key] = body;
  });
  return sections;
}

function isCorrelated(item, redFlagText) {
  if (!redFlagText || /no immediate red flag/i.test(redFlagText)) return false;
  return redFlagText.trim().length > 10 && !/no immediate/i.test(redFlagText);
}

function buildSystemPrompt(patient) {
  const publicHistory = patient.medical_history
    .filter(h => !h.sensitive)
    .map(h => `  • [${h.year}] ${h.event}`)
    .join('\n') || '  • No significant non-sensitive history on file.';

  const sensitiveHistory = patient.medical_history
    .filter(h => h.sensitive)
    .map(h => `  • [${h.year}] [SENSITIVE-${h.reason.toUpperCase()}] ${h.event}`)
    .join('\n') || '  None.';

  const meds       = patient.current_medications.map(m => `  • ${m}`).join('\n');
  const allergies  = patient.allergies.map(a => `  • ${a}`).join('\n');
  const conditions = patient.chronic_conditions.map(c => `  • ${c}`).join('\n');

  return `
You are ARIA — Autonomous Rapid Intake Agent — a Level 1 Clinical Triage AI operating within a certified hospital network under ABDM protocols. Certified under DPDPA 2023.

ABHA Medical ID : ${patient.id}
Full Name       : ${patient.name}
Age / DOB       : ${patient.age} years | ${patient.dob}
Sex             : ${patient.sex}
Blood Type      : ${patient.blood_type}
Weight / Height : ${patient.weight_kg} kg / ${patient.height_cm} cm

KNOWN ALLERGIES (CRITICAL):
${allergies}

CURRENT MEDICATIONS:
${meds}

CHRONIC CONDITIONS:
${conditions}

NON-SENSITIVE MEDICAL HISTORY:
${publicHistory}

▓▓▓ SENSITIVE MEDICAL HISTORY — PRIVACY FIREWALL ACTIVE ▓▓▓
${sensitiveHistory}

PRIVACY FIREWALL — MANDATORY RULES
RULE 1 — ABSOLUTE PROHIBITION: You MUST NEVER disclose any SENSITIVE record.
RULE 2 — CLINICAL CORRELATION EXCEPTION: Flag dangerous correlations using clinical language only.
RULE 3 — DEFLECTION PROTOCOL: If patient asks about sensitive history, deflect professionally.
RULE 4 — NO SPECULATION: Base all flags strictly on documented records.

After 2–3 questions output [INTERVIEW_COMPLETE] then generate the Doctor Handoff Report.
`.trim();
}

module.exports = { formatMedId, escapeHtml, parseReportSections, isCorrelated, buildSystemPrompt };
