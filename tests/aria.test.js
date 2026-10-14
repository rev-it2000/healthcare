/**
 * ARIA — Unit Tests
 * Run with: npm test
 */

// ── Mock browser globals (not available in Node) ─────────────────────────────
global.sessionStorage = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
global.window = { location: { origin: 'http://localhost:3000' } };
global.fetch  = jest.fn();
global.document = { getElementById: jest.fn(), querySelectorAll: jest.fn(() => []), addEventListener: jest.fn() };

// ── Load modules ──────────────────────────────────────────────────────────────
const { PATIENT_DATABASE, getPatientById, getDemoIds } = require('../patients-module');
const {
  formatMedId,
  escapeHtml,
  parseReportSections,
  isCorrelated,
  buildSystemPrompt,
} = require('../app-module');

// =============================================================================
//  patients.test — Patient Database
// =============================================================================
describe('Patient Database', () => {
  test('contains exactly 4 patients', () => {
    expect(Object.keys(PATIENT_DATABASE)).toHaveLength(4);
  });

  test('getPatientById returns correct patient for valid ID', () => {
    const p = getPatientById('12345678901234');
    expect(p).not.toBeNull();
    expect(p.name).toBe('Rahul Sharma');
    expect(p.age).toBe(47);
  });

  test('getPatientById returns null for unknown ID', () => {
    expect(getPatientById('00000000000000')).toBeNull();
  });

  test('getPatientById strips whitespace from ID', () => {
    const p = getPatientById('1234 5678 9012 34');
    expect(p).not.toBeNull();
    expect(p.name).toBe('Rahul Sharma');
  });

  test('all patients have required fields', () => {
    const required = ['id','name','age','sex','blood_type','allergies','current_medications','medical_history'];
    Object.values(PATIENT_DATABASE).forEach(patient => {
      required.forEach(field => {
        expect(patient).toHaveProperty(field);
      });
    });
  });

  test('sensitive records are correctly flagged', () => {
    const rahul = getPatientById('12345678901234');
    const sensitiveItems = rahul.medical_history.filter(h => h.sensitive);
    expect(sensitiveItems.length).toBeGreaterThan(0);
    sensitiveItems.forEach(item => {
      expect(item).toHaveProperty('reason');
    });
  });

  test('getDemoIds returns array with correct structure', () => {
    const demos = getDemoIds();
    expect(Array.isArray(demos)).toBe(true);
    expect(demos).toHaveLength(4);
    demos.forEach(d => {
      expect(d).toHaveProperty('id');
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('age');
      expect(d).toHaveProperty('scenario');
    });
  });
});

// =============================================================================
//  formatMedId — ID Formatting
// =============================================================================
describe('formatMedId()', () => {
  test('formats 14-digit ID with spaces', () => {
    expect(formatMedId('12345678901234')).toBe('1234 5678 9012 34');
  });

  test('handles already-spaced input', () => {
    expect(formatMedId('12345678901234')).toMatch(/^\d{4} \d{4} \d{4} \d{2}$/);
  });
});

// =============================================================================
//  escapeHtml — XSS Protection
// =============================================================================
describe('escapeHtml()', () => {
  test('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  test('returns non-string as string', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('null');
  });

  test('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });
});

// =============================================================================
//  parseReportSections — Markdown Parser
// =============================================================================
describe('parseReportSections()', () => {
  const sampleReport = `## Doctor Handoff Report

### 1. Patient Status
**[STABLE]**
Patient is stable with no immediate life threat.

### 2. Vitals & Allergies
- Blood Type: B+

### 3. Presenting Complaint
Patient reports chest pain for 2 hours.

### 4. Red Flags
⚠ Cardiac history requires immediate ECG.`;

  test('parses all four sections', () => {
    const sections = parseReportSections(sampleReport);
    expect(sections).toHaveProperty('1. Patient Status');
    expect(sections).toHaveProperty('2. Vitals & Allergies');
    expect(sections).toHaveProperty('3. Presenting Complaint');
    expect(sections).toHaveProperty('4. Red Flags');
  });

  test('extracts correct content for Patient Status', () => {
    const sections = parseReportSections(sampleReport);
    expect(sections['1. Patient Status']).toContain('STABLE');
  });

  test('returns empty object for empty input', () => {
    expect(parseReportSections('')).toEqual({});
  });
});

// =============================================================================
//  isCorrelated — Red Flag Heuristic
// =============================================================================
describe('isCorrelated()', () => {
  test('returns false when no red flags exist', () => {
    expect(isCorrelated({reason:'psychiatric'}, '')).toBe(false);
    expect(isCorrelated({reason:'psychiatric'}, 'No immediate red flag identified.')).toBe(false);
  });

  test('returns true when red flags contain substantive text', () => {
    expect(isCorrelated({reason:'substance_abuse'}, '⚠ Opioid-class analgesics are contraindicated.')).toBe(true);
  });
});

// =============================================================================
//  buildSystemPrompt — Privacy Firewall
// =============================================================================
describe('buildSystemPrompt() — Privacy Firewall', () => {
  const patient = getPatientById('12345678901234');
  const prompt   = buildSystemPrompt(patient);

  test('prompt is a non-empty string', () => {
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(500);
  });

  test('includes patient name and ABHA ID', () => {
    expect(prompt).toContain(patient.name);
    expect(prompt).toContain(patient.id);
  });

  test('includes PRIVACY FIREWALL rules', () => {
    expect(prompt).toContain('PRIVACY FIREWALL');
    expect(prompt).toContain('RULE 1');
  });

  test('includes sensitive history marker', () => {
    expect(prompt).toContain('SENSITIVE');
  });

  test('does NOT expose raw sensitive label in non-sensitive section', () => {
    // Sensitive items must be in the SENSITIVE block, not the public history block
    expect(prompt).toContain('NON-SENSITIVE MEDICAL HISTORY');
    expect(prompt).toContain('SENSITIVE MEDICAL HISTORY');
  });

  test('includes allergies', () => {
    patient.allergies.forEach(allergy => {
      expect(prompt).toContain(allergy.split('(')[0].trim());
    });
  });

  test('contains [INTERVIEW_COMPLETE] instruction', () => {
    expect(prompt).toContain('[INTERVIEW_COMPLETE]');
  });
});

// =============================================================================
//  Security — Input Validation
// =============================================================================
describe('Security — Input Validation', () => {
  test('getPatientById rejects injection-style inputs', () => {
    expect(getPatientById('<script>alert(1)</script>')).toBeNull();
    expect(getPatientById('"; DROP TABLE patients; --')).toBeNull();
    expect(getPatientById('')).toBeNull();
  });

  test('escapeHtml prevents XSS in all patient name fields', () => {
    Object.values(PATIENT_DATABASE).forEach(p => {
      const escaped = escapeHtml(p.name);
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
    });
  });
});
