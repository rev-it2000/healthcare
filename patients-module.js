// patients-module.js — CommonJS export of patients.js for testing
const PATIENT_DATABASE = {
  "12345678901234": {
    id: "12345678901234", name: "Rahul Sharma", age: 47, dob: "1977-03-14", sex: "Male",
    blood_type: "B+", weight_kg: 82, height_cm: 172,
    allergies: ["Penicillin", "Aspirin (causes GI bleed)"],
    current_medications: ["Atenolol 50mg (once daily)", "Atorvastatin 20mg (nightly)", "Metformin 500mg (twice daily)"],
    chronic_conditions: ["Type 2 Diabetes (diagnosed 2018)", "Hypertension (diagnosed 2016)"],
    medical_history: [
      { year: 2019, event: "Mild Myocardial Infarction — STEMI, treated with drug-eluting stent", sensitive: false },
      { year: 2020, event: "Coronary Artery Disease — confirmed on angiography", sensitive: false },
      { year: 2021, event: "Depression and anxiety — treated with CBT and Sertraline, now resolved", sensitive: true, reason: "psychiatric" },
    ],
    last_visit: "2025-11-20", primary_physician: "Dr. Anjali Nair, Cardiologist", scenario_tag: "cardiac_redflg"
  },
  "98765432109876": {
    id: "98765432109876", name: "Priya Mehta", age: 31, dob: "1993-07-22", sex: "Female",
    blood_type: "O+", weight_kg: 58, height_cm: 162,
    allergies: ["Latex", "Codeine (causes nausea/vomiting)"],
    current_medications: ["Levothyroxine 50mcg (once daily)", "Folic acid 5mg (once daily)"],
    chronic_conditions: ["Hypothyroidism (diagnosed 2020)"],
    medical_history: [
      { year: 2021, event: "IVF Cycle 1 — unsuccessful", sensitive: true, reason: "reproductive" },
      { year: 2022, event: "IVF Cycle 2 — successful", sensitive: true, reason: "reproductive" },
      { year: 2022, event: "Antenatal anxiety — brief counselling, resolved", sensitive: true, reason: "psychiatric" },
      { year: 2024, event: "Wrist sprain (left) — conservatively managed", sensitive: false },
    ],
    last_visit: "2025-08-10", primary_physician: "Dr. Kavita Iyer, Endocrinologist", scenario_tag: "privacy_suppressed"
  },
  "11223344556677": {
    id: "11223344556677", name: "Arun Kumar", age: 29, dob: "1995-12-05", sex: "Male",
    blood_type: "A-", weight_kg: 71, height_cm: 178,
    allergies: ["NSAIDs (ibuprofen — causes GI haemorrhage)", "Tramadol (contraindicated — prior opioid sensitivity)"],
    current_medications: ["Naltrexone 50mg (once daily)", "Pantoprazole 40mg (once daily)"],
    chronic_conditions: ["Opioid Use Disorder — sustained full remission (3 years)", "Gastritis"],
    medical_history: [
      { year: 2020, event: "Opioid Use Disorder — inpatient detox 21 days, MAT initiated", sensitive: true, reason: "substance_abuse" },
      { year: 2021, event: "Alcohol Use Disorder — 6 months outpatient group therapy", sensitive: true, reason: "substance_abuse" },
      { year: 2022, event: "Severe gastritis secondary to NSAID overuse", sensitive: false },
      { year: 2023, event: "Naltrexone initiated for relapse prevention", sensitive: false },
    ],
    last_visit: "2026-01-08", primary_physician: "Dr. Suresh Pillai, Internal Medicine", scenario_tag: "substance_redflg"
  },
  "55667788990011": {
    id: "55667788990011", name: "Meera Nair", age: 63, dob: "1961-09-30", sex: "Female",
    blood_type: "AB+", weight_kg: 68, height_cm: 158,
    allergies: ["Sulfa drugs", "Contrast dye (iodine-based — prior anaphylaxis)"],
    current_medications: ["Warfarin 5mg (daily)", "Ramipril 5mg (once daily)", "Furosemide 40mg (once daily)", "Digoxin 0.125mg (once daily)"],
    chronic_conditions: ["Atrial Fibrillation (AF)", "Congestive Heart Failure (CHF) — NYHA Class II", "Hypertension"],
    medical_history: [
      { year: 2018, event: "Ischaemic Stroke — mild, full recovery, anticoagulation initiated", sensitive: false },
      { year: 2020, event: "Elective cardioversion for AF — successful", sensitive: false },
      { year: 2022, event: "BRCA1 positive — bilateral prophylactic mastectomy", sensitive: true, reason: "reproductive" },
      { year: 2023, event: "Post-surgical depression — 9 months SSRI therapy, now stable", sensitive: true, reason: "psychiatric" },
      { year: 2024, event: "CHF exacerbation — hospitalised 5 days", sensitive: false },
    ],
    last_visit: "2026-03-22", primary_physician: "Dr. Ramesh Gupta, Cardiologist", scenario_tag: "multi_redflg"
  }
};

// ── Memoization cache (efficiency: avoids repeated lookups) ──────────────────
const _patientCache = new Map();

/**
 * Look up a patient by their 14-digit ABHA Medical ID.
 * Results are memoized in-memory for the session lifetime.
 * @param {string} id - Raw or space-separated 14-digit ABHA ID
 * @returns {object|null} Patient record or null if not found
 */
function getPatientById(id) {
  const cleanId = id.replace(/\s/g, '').trim();
  if (_patientCache.has(cleanId)) return _patientCache.get(cleanId);
  const patient = PATIENT_DATABASE[cleanId] || null;
  if (patient) _patientCache.set(cleanId, patient);
  return patient;
}

/**
 * Returns a list of demo patient IDs with display metadata.
 * @returns {Array<{id: string, name: string, age: number, scenario: string}>}
 */
function getDemoIds() {
  return Object.keys(PATIENT_DATABASE).map(id => ({
    id,
    name:     PATIENT_DATABASE[id].name,
    age:      PATIENT_DATABASE[id].age,
    scenario: PATIENT_DATABASE[id].scenario_tag,
  }));
}

module.exports = { PATIENT_DATABASE, getPatientById, getDemoIds };
