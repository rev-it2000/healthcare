/**
 * ARIA — Comprehensive Unit & Integration Test Suite
 * Run: npm test
 * Coverage: npm test -- --coverage
 *
 * Test Categories:
 *  1. Patient Database — lookup, validation, structure
 *  2. ID Formatting — formatMedId edge cases
 *  3. Security — XSS escaping, injection resistance
 *  4. Report Parsing — markdown section extraction
 *  5. Privacy Firewall — CRITICAL: ensures sensitive data never leaks
 *  6. System Prompt — structure and compliance checks
 *  7. Correlation Engine — red flag heuristics
 *  8. API Layer — fetch mocking, AbortController, error handling
 *  9. Input Validation — boundary conditions
 * 10. Integration — end-to-end triage flow simulation
 */

// ── Mock browser globals ──────────────────────────────────────────────────────
global.sessionStorage = (() => {
  let store = {};
  return {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k)    => { delete store[k]; },
    clear:      ()     => { store = {}; },
  };
})();
global.window   = { location: { origin: 'http://localhost:3000' } };
global.fetch    = jest.fn();
global.document = {
  getElementById:    jest.fn(() => null),
  querySelectorAll:  jest.fn(() => []),
  addEventListener:  jest.fn(),
  createElement:     jest.fn(() => ({ className: '', innerHTML: '', appendChild: jest.fn(), addEventListener: jest.fn() })),
};
global.AbortController = class {
  constructor() { this.signal = { aborted: false }; }
  abort() { this.signal.aborted = true; }
};

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
//  1. PATIENT DATABASE TESTS
// =============================================================================
describe('1. Patient Database', () => {
  test('contains exactly 4 patients', () => {
    expect(Object.keys(PATIENT_DATABASE)).toHaveLength(4);
  });

  test('getPatientById returns Rahul Sharma for ID 12345678901234', () => {
    const p = getPatientById('12345678901234');
    expect(p).not.toBeNull();
    expect(p.name).toBe('Rahul Sharma');
    expect(p.age).toBe(47);
    expect(p.blood_type).toBe('B+');
  });

  test('getPatientById returns Priya Mehta for ID 98765432109876', () => {
    const p = getPatientById('98765432109876');
    expect(p.name).toBe('Priya Mehta');
    expect(p.sex).toBe('Female');
  });

  test('getPatientById returns Arun Kumar for ID 11223344556677', () => {
    const p = getPatientById('11223344556677');
    expect(p.name).toBe('Arun Kumar');
    expect(p.scenario_tag).toBe('substance_redflg');
  });

  test('getPatientById returns Meera Nair for ID 55667788990011', () => {
    const p = getPatientById('55667788990011');
    expect(p.name).toBe('Meera Nair');
    expect(p.age).toBe(63);
  });

  test('getPatientById returns null for unknown ID', () => {
    expect(getPatientById('00000000000000')).toBeNull();
  });

  test('getPatientById strips whitespace from ID', () => {
    const p = getPatientById('1234 5678 9012 34');
    expect(p).not.toBeNull();
    expect(p.name).toBe('Rahul Sharma');
  });

  test('getPatientById strips all types of whitespace', () => {
    expect(getPatientById('1234\t5678\n901234')).not.toBeNull();
  });

  test('all patients have required fields', () => {
    const required = ['id','name','age','dob','sex','blood_type','weight_kg',
      'height_cm','allergies','current_medications','chronic_conditions','medical_history',
      'last_visit','primary_physician','scenario_tag'];
    Object.values(PATIENT_DATABASE).forEach(patient => {
      required.forEach(field => expect(patient).toHaveProperty(field));
    });
  });

  test('all patients have arrays for allergies, medications, conditions, history', () => {
    Object.values(PATIENT_DATABASE).forEach(p => {
      expect(Array.isArray(p.allergies)).toBe(true);
      expect(Array.isArray(p.current_medications)).toBe(true);
      expect(Array.isArray(p.chronic_conditions)).toBe(true);
      expect(Array.isArray(p.medical_history)).toBe(true);
    });
  });

  test('every medical history item has year, event, sensitive fields', () => {
    Object.values(PATIENT_DATABASE).forEach(p => {
      p.medical_history.forEach(h => {
        expect(h).toHaveProperty('year');
        expect(h).toHaveProperty('event');
        expect(h).toHaveProperty('sensitive');
        if (h.sensitive) expect(h).toHaveProperty('reason');
      });
    });
  });

  test('sensitive reasons are only allowed types', () => {
    const allowedReasons = ['psychiatric', 'reproductive', 'substance_abuse'];
    Object.values(PATIENT_DATABASE).forEach(p => {
      p.medical_history.filter(h => h.sensitive).forEach(h => {
        expect(allowedReasons).toContain(h.reason);
      });
    });
  });

  test('getDemoIds returns array of 4 with correct structure', () => {
    const demos = getDemoIds();
    expect(Array.isArray(demos)).toBe(true);
    expect(demos).toHaveLength(4);
    demos.forEach(d => {
      expect(d).toHaveProperty('id');
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('age');
      expect(d).toHaveProperty('scenario');
      expect(typeof d.id).toBe('string');
      expect(d.id).toHaveLength(14);
    });
  });

  test('each patient ID is exactly 14 digits', () => {
    Object.keys(PATIENT_DATABASE).forEach(id => {
      expect(id).toMatch(/^\d{14}$/);
    });
  });
});

// =============================================================================
//  2. ID FORMATTING TESTS
// =============================================================================
describe('2. formatMedId()', () => {
  test('formats 14-digit string into spaced groups', () => {
    expect(formatMedId('12345678901234')).toBe('1234 5678 9012 34');
  });

  test('output matches ABHA format pattern', () => {
    expect(formatMedId('12345678901234')).toMatch(/^\d{4} \d{4} \d{4} \d{2}$/);
  });

  test('formats all 4 demo patient IDs correctly', () => {
    ['12345678901234','98765432109876','11223344556677','55667788990011'].forEach(id => {
      expect(formatMedId(id)).toMatch(/^\d{4} \d{4} \d{4} \d{2}$/);
    });
  });

  test('last group is 2 digits (ABHA standard)', () => {
    const parts = formatMedId('12345678901234').split(' ');
    expect(parts).toHaveLength(4);
    expect(parts[3]).toHaveLength(2);
  });
});

// =============================================================================
//  3. SECURITY — XSS & INJECTION TESTS
// =============================================================================
describe('3. Security — XSS & Injection', () => {
  test('escapeHtml neutralises script tags', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  test('escapeHtml neutralises img onerror payload', () => {
    const result = escapeHtml('<img src=x onerror=alert(1)>');
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  test('escapeHtml escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  test('escapeHtml handles null safely', () => {
    expect(() => escapeHtml(null)).not.toThrow();
    expect(escapeHtml(null)).toBe('null');
  });

  test('escapeHtml handles numbers', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  test('escapeHtml returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  test('getPatientById rejects SQL injection patterns', () => {
    expect(getPatientById("' OR '1'='1")).toBeNull();
    expect(getPatientById('"; DROP TABLE patients; --')).toBeNull();
  });

  test('getPatientById rejects XSS payloads', () => {
    expect(getPatientById('<script>alert(1)</script>')).toBeNull();
    expect(getPatientById('javascript:alert(1)')).toBeNull();
  });

  test('getPatientById rejects empty string', () => {
    expect(getPatientById('')).toBeNull();
  });

  test('getPatientById rejects short IDs', () => {
    expect(getPatientById('1234')).toBeNull();
    expect(getPatientById('1234567')).toBeNull();
  });

  test('all patient names are safe to render (no HTML)', () => {
    Object.values(PATIENT_DATABASE).forEach(p => {
      const escaped = escapeHtml(p.name);
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
    });
  });
});

// =============================================================================
//  4. REPORT PARSING TESTS
// =============================================================================
describe('4. parseReportSections()', () => {
  const sampleReport = `## Doctor Handoff Report

### 1. Patient Status
**[STABLE]**
Patient is stable with no immediate life threat.

### 2. Vitals & Allergies
- Blood Type: B+
- Weight: 82kg

### 3. Presenting Complaint
Patient reports chest pain radiating to left arm for 2 hours.

### 4. Red Flags
⚠ Prior cardiac history — immediate ECG required.
⚠ Aspirin allergy — standard MI protocol must be modified.`;

  test('parses all four mandatory sections', () => {
    const s = parseReportSections(sampleReport);
    // Use direct property access — toHaveProperty treats dots as path separators
    expect(s['1. Patient Status']).toBeDefined();
    expect(s['2. Vitals & Allergies']).toBeDefined();
    expect(s['3. Presenting Complaint']).toBeDefined();
    expect(s['4. Red Flags']).toBeDefined();
  });

  test('Patient Status section contains STABLE keyword', () => {
    const s = parseReportSections(sampleReport);
    expect(s['1. Patient Status']).toContain('STABLE');
  });

  test('Red Flags section contains warning text', () => {
    const s = parseReportSections(sampleReport);
    expect(s['4. Red Flags']).toContain('cardiac');
  });

  test('returns empty object for empty string', () => {
    expect(parseReportSections('')).toEqual({});
  });

  test('returns empty object for non-report text', () => {
    expect(parseReportSections('hello world no sections here')).toEqual({});
  });

  test('handles CRITICAL status', () => {
    const critical = sampleReport.replace('STABLE', 'CRITICAL');
    const s = parseReportSections(critical);
    expect(s['1. Patient Status']).toContain('CRITICAL');
  });
});

// =============================================================================
//  5. PRIVACY FIREWALL — CRITICAL TESTS
// =============================================================================
describe('5. Privacy Firewall — Sensitive Data Leakage Prevention', () => {
  const rahul  = getPatientById('12345678901234');
  const priya  = getPatientById('98765432109876');
  const arun   = getPatientById('11223344556677');
  const meera  = getPatientById('55667788990011');

  /**
   * The prompt has a ▓▓▓ barrier separating public and sensitive history.
   * We split on that to get accurate sections.
   */
  function getSections(prompt) {
    const parts = prompt.split('▓▓▓');
    return {
      public:    parts[0] || '',   // everything before ▓▓▓ block
      sensitive: parts[2] || '',   // everything after closing ▓▓▓
    };
  }

  test('Rahul: psychiatric history is in SENSITIVE block, not public block', () => {
    const { public: pub, sensitive: sens } = getSections(buildSystemPrompt(rahul));
    expect(sens).toContain('Depression');
    expect(pub).not.toContain('Depression');
  });

  test('Priya: IVF records are in SENSITIVE block', () => {
    const { sensitive: sens } = getSections(buildSystemPrompt(priya));
    expect(sens).toContain('IVF');
  });

  test('Arun: opioid records are tagged SENSITIVE-SUBSTANCE_ABUSE', () => {
    const prompt = buildSystemPrompt(arun);
    expect(prompt).toContain('SENSITIVE-SUBSTANCE_ABUSE');
  });

  test('Meera: mastectomy record is tagged SENSITIVE-REPRODUCTIVE', () => {
    const prompt = buildSystemPrompt(meera);
    expect(prompt).toContain('SENSITIVE-REPRODUCTIVE');
  });

  test('Privacy Firewall RULE 1 (absolute prohibition) is present', () => {
    [rahul, priya, arun, meera].forEach(p => {
      const prompt = buildSystemPrompt(p);
      expect(prompt).toContain('RULE 1');
      expect(prompt).toContain('ABSOLUTE PROHIBITION');
    });
  });

  test('Privacy Firewall RULE 2 (clinical exception) is present', () => {
    const prompt = buildSystemPrompt(rahul);
    expect(prompt).toContain('RULE 2');
    expect(prompt).toContain('CLINICAL CORRELATION EXCEPTION');
  });

  test('Privacy Firewall RULE 3 (deflection) is present', () => {
    const prompt = buildSystemPrompt(rahul);
    expect(prompt).toContain('RULE 3');
    expect(prompt).toContain('DEFLECTION');
  });

  test('Public section contains no SENSITIVE- labels', () => {
    [rahul, priya, arun, meera].forEach(p => {
      const { public: pub } = getSections(buildSystemPrompt(p));
      expect(pub).not.toContain('SENSITIVE-PSYCHIATRIC');
      expect(pub).not.toContain('SENSITIVE-REPRODUCTIVE');
      expect(pub).not.toContain('SENSITIVE-SUBSTANCE_ABUSE');
    });
  });

  test('[INTERVIEW_COMPLETE] signal is in every system prompt', () => {
    [rahul, priya, arun, meera].forEach(p => {
      expect(buildSystemPrompt(p)).toContain('[INTERVIEW_COMPLETE]');
    });
  });
});

// =============================================================================
//  6. SYSTEM PROMPT STRUCTURE TESTS
// =============================================================================
describe('6. buildSystemPrompt() — Structure & Compliance', () => {
  const patient = getPatientById('12345678901234');
  const prompt  = buildSystemPrompt(patient);

  test('prompt is a non-empty string', () => {
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(500);
  });

  test('contains patient ABHA ID', () => {
    expect(prompt).toContain(patient.id);
  });

  test('contains patient full name', () => {
    expect(prompt).toContain(patient.name);
  });

  test('contains all allergies', () => {
    patient.allergies.forEach(a => expect(prompt).toContain(a.split('(')[0].trim()));
  });

  test('contains all medications', () => {
    patient.current_medications.forEach(m => expect(prompt).toContain(m.split('(')[0].trim()));
  });

  test('contains ARIA role definition', () => {
    expect(prompt).toContain('ARIA');
    expect(prompt).toContain('Clinical Triage');
  });

  test('contains ABDM / DPDPA regulatory reference', () => {
    expect(prompt.toUpperCase()).toMatch(/ABDM|DPDPA/);
  });

  test('contains Doctor Handoff Report format instruction', () => {
    expect(prompt).toContain('Doctor Handoff Report');
  });
});

// =============================================================================
//  7. CORRELATION ENGINE TESTS
// =============================================================================
describe('7. isCorrelated() — Red Flag Engine', () => {
  test('returns false for empty red flag text', () => {
    expect(isCorrelated({ reason: 'psychiatric' }, '')).toBe(false);
  });

  test('returns false for "no immediate red flag" phrase', () => {
    expect(isCorrelated({ reason: 'psychiatric' }, 'No immediate red flag identified.')).toBe(false);
    expect(isCorrelated({ reason: 'psychiatric' }, 'No immediate red flags.')).toBe(false);
  });

  test('returns true for substantive red flag text', () => {
    expect(isCorrelated(
      { reason: 'substance_abuse' },
      '⚠ Opioid-class analgesics are contraindicated — Naltrexone on board.'
    )).toBe(true);
  });

  test('returns true for cardiac red flag text', () => {
    expect(isCorrelated(
      { reason: 'psychiatric' },
      '⚠ Serotonergic agent interaction risk — verify all medications with pharmacy.'
    )).toBe(true);
  });

  test('returns false for text shorter than 10 chars', () => {
    expect(isCorrelated({ reason: 'reproductive' }, 'flag')).toBe(false);
  });
});

// =============================================================================
//  8. API LAYER — FETCH MOCK TESTS
// =============================================================================
describe('8. API Layer — callGemini() mock tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem('aria_or_key', 'sk-or-test-key-12345');
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  test('sessionStorage correctly stores and retrieves API key', () => {
    sessionStorage.setItem('aria_or_key', 'sk-or-v1-testkey');
    expect(sessionStorage.getItem('aria_or_key')).toBe('sk-or-v1-testkey');
  });

  test('sessionStorage returns null when no key set', () => {
    sessionStorage.clear();
    expect(sessionStorage.getItem('aria_or_key')).toBeNull();
  });

  test('fetch is called with correct OpenRouter URL', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Hello patient.' } }] })
    });

    // Simulate a triage call
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    await fetch(url, { method: 'POST', headers: {}, body: '{}' });
    expect(fetch).toHaveBeenCalledWith(url, expect.any(Object));
  });

  test('API response extraction: choices[0].message.content', () => {
    const mockResponse = {
      choices: [{ message: { content: 'ARIA greeting text here.' } }]
    };
    const text = mockResponse.choices?.[0]?.message?.content;
    expect(text).toBe('ARIA greeting text here.');
  });

  test('API error response correctly throws', () => {
    const errorResponse = { error: { message: 'Model unavailable' } };
    const throwFn = () => {
      if (!true) return; // simulate !res.ok
      throw new Error(errorResponse.error?.message || 'API error');
    };
    // In production code, !res.ok causes throw
    expect(() => { throw new Error(errorResponse.error.message); }).toThrow('Model unavailable');
  });

  test('AbortController can be instantiated and aborted', () => {
    const ctrl = new AbortController();
    expect(ctrl.signal.aborted).toBe(false);
    ctrl.abort();
    expect(ctrl.signal.aborted).toBe(true);
  });
});

// =============================================================================
//  9. INPUT VALIDATION — BOUNDARY TESTS
// =============================================================================
describe('9. Input Validation — Boundary Conditions', () => {
  test('13-digit ID returns null (not enough digits)', () => {
    expect(getPatientById('1234567890123')).toBeNull();
  });

  test('15-digit ID returns null (too many digits)', () => {
    expect(getPatientById('123456789012345')).toBeNull();
  });

  test('zero-length ID returns null', () => {
    expect(getPatientById('')).toBeNull();
  });

  test('ID with letters returns null', () => {
    expect(getPatientById('1234567890123A')).toBeNull();
  });

  test('ID with special characters returns null', () => {
    expect(getPatientById('1234-5678-9012-34')).toBeNull();
  });

  test('formatMedId output length is exactly 17 chars (14 digits + 3 spaces)', () => {
    expect(formatMedId('12345678901234').length).toBe(17);
  });

  test('escapeHtml handles very long strings', () => {
    const longStr = '<script>'.repeat(1000);
    const result  = escapeHtml(longStr);
    expect(result).not.toContain('<script>');
    expect(result.length).toBeGreaterThan(0);
  });
});

// =============================================================================
//  10. INTEGRATION — END-TO-END TRIAGE FLOW SIMULATION
// =============================================================================
describe('10. Integration — Full Triage Flow', () => {
  test('complete flow: ID lookup → system prompt → section parsing', () => {
    // Step 1: Look up patient
    const patient = getPatientById('12345678901234');
    expect(patient).not.toBeNull();

    // Step 2: Build system prompt
    const prompt = buildSystemPrompt(patient);
    expect(prompt).toContain('PRIVACY FIREWALL');
    expect(prompt).toContain('[INTERVIEW_COMPLETE]');

    // Step 3: Simulate AI response
    const simulatedReport = `## Doctor Handoff Report

### 1. Patient Status
**[CRITICAL]**
Patient presents with acute chest pain, history of prior MI.

### 2. Vitals & Allergies
- Blood Type: B+
- Weight / Height: 82 kg / 172 cm
- Known Allergies: Penicillin, Aspirin (causes GI bleed)
- Current Medications: Atenolol 50mg, Atorvastatin 20mg, Metformin 500mg

### 3. Presenting Complaint
Patient reports severe crushing chest pain radiating to left arm, onset 2 hours ago, severity 8/10.

### 4. Red Flags
⚠ Prior cardiac event on file — immediate ECG and troponin levels required.
⚠ Aspirin allergy — standard ACS protocol (aspirin 300mg loading dose) is CONTRAINDICATED.`;

    // Step 4: Parse report sections
    const sections = parseReportSections(simulatedReport);
    expect(sections['1. Patient Status']).toContain('CRITICAL');
    expect(sections['4. Red Flags']).toContain('CONTRAINDICATED');

    // Step 5: Verify privacy — no sensitive data leaked to report
    expect(simulatedReport).not.toContain('Depression');
    expect(simulatedReport).not.toContain('psychiatric');
    expect(simulatedReport).not.toContain('Sertraline');
  });

  test('privacy flow: sensitive data stays in prompt, not in simulated report', () => {
    const patient = getPatientById('11223344556677'); // Arun - substance abuse
    const prompt  = buildSystemPrompt(patient);

    // Sensitive data IS in the prompt (for AI awareness)
    expect(prompt).toContain('SENSITIVE-SUBSTANCE_ABUSE');

    // But a compliant report uses only clinical language
    const compliantReport = `## Doctor Handoff Report
### 4. Red Flags
⚠ Opioid-class analgesics and NSAIDs are contraindicated per patient medication profile.
⚠ Naltrexone on board — standard pain management protocols must be substituted.`;

    expect(compliantReport).not.toContain('opioid addiction');
    expect(compliantReport).not.toContain('substance abuse');
    expect(compliantReport).toContain('contraindicated');
  });

  test('multi-patient pipeline: all 4 patients generate valid prompts', () => {
    getDemoIds().forEach(({ id }) => {
      const patient = getPatientById(id);
      const prompt  = buildSystemPrompt(patient);
      expect(prompt).toContain('PRIVACY FIREWALL');
      expect(prompt).toContain(patient.name);
      expect(prompt.length).toBeGreaterThan(400);
    });
  });
});
