// Simulated Patient Database — Keyed by 14-digit Medical ID
// Sensitive fields are flagged; the Privacy Firewall in the system prompt handles them.

const PATIENT_DATABASE = {

  "12345678901234": {
    id: "12345678901234",
    name: "Rahul Sharma",
    age: 47,
    dob: "1977-03-14",
    sex: "Male",
    blood_type: "B+",
    weight_kg: 82,
    height_cm: 172,
    contact: "+91-9876543210",
    emergency_contact: "Sunita Sharma (Wife) — +91-9988776655",
    allergies: ["Penicillin", "Aspirin (causes GI bleed)"],
    current_medications: ["Atenolol 50mg (once daily)", "Atorvastatin 20mg (nightly)", "Metformin 500mg (twice daily)"],
    chronic_conditions: ["Type 2 Diabetes (diagnosed 2018)", "Hypertension (diagnosed 2016)"],
    medical_history: [
      { year: 2019, event: "Mild Myocardial Infarction (heart attack) — STEMI, treated with drug-eluting stent (LAD artery)", sensitive: false },
      { year: 2020, event: "Coronary Artery Disease — confirmed on angiography, managed medically", sensitive: false },
      { year: 2021, event: "Depression and anxiety following cardiac event — treated with CBT and Sertraline for 18 months, now resolved", sensitive: true, reason: "psychiatric" },
    ],
    last_visit: "2025-11-20",
    primary_physician: "Dr. Anjali Nair, Cardiologist",
    // Scenario hint: chest pain → WILL trigger Red Flag (cardiac correlation)
    scenario_tag: "cardiac_redflg"
  },

  "98765432109876": {
    id: "98765432109876",
    name: "Priya Mehta",
    age: 31,
    dob: "1993-07-22",
    sex: "Female",
    blood_type: "O+",
    weight_kg: 58,
    height_cm: 162,
    contact: "+91-9823456789",
    emergency_contact: "Rajan Mehta (Husband) — +91-9911223344",
    allergies: ["Latex", "Codeine (causes nausea/vomiting)"],
    current_medications: ["Levothyroxine 50mcg (once daily)", "Folic acid 5mg (once daily)"],
    chronic_conditions: ["Hypothyroidism (diagnosed 2020)"],
    medical_history: [
      { year: 2021, event: "IVF Cycle 1 — unsuccessful, no complications", sensitive: true, reason: "reproductive" },
      { year: 2022, event: "IVF Cycle 2 — successful, delivered healthy baby (2023)", sensitive: true, reason: "reproductive" },
      { year: 2022, event: "Antenatal anxiety disorder during pregnancy — brief counselling, resolved post-partum", sensitive: true, reason: "psychiatric" },
      { year: 2024, event: "Wrist sprain (left) — conservatively managed", sensitive: false },
    ],
    last_visit: "2025-08-10",
    primary_physician: "Dr. Kavita Iyer, Endocrinologist",
    // Scenario hint: fractured right wrist → Privacy Firewall suppresses ALL sensitive fields
    scenario_tag: "privacy_suppressed"
  },

  "11223344556677": {
    id: "11223344556677",
    name: "Arun Kumar",
    age: 29,
    dob: "1995-12-05",
    sex: "Male",
    blood_type: "A-",
    weight_kg: 71,
    height_cm: 178,
    contact: "+91-9765432188",
    emergency_contact: "Leela Kumar (Mother) — +91-9944332211",
    allergies: ["NSAIDs (ibuprofen — causes GI haemorrhage)", "Tramadol (contraindicated — prior opioid sensitivity)"],
    current_medications: ["Naltrexone 50mg (once daily — for relapse prevention)", "Pantoprazole 40mg (once daily)"],
    chronic_conditions: ["Opioid Use Disorder — sustained full remission (3 years)", "Gastritis"],
    medical_history: [
      { year: 2020, event: "Opioid Use Disorder — inpatient detox over 21 days, followed by MAT (Buprenorphine/Naloxone for 12 months)", sensitive: true, reason: "substance_abuse" },
      { year: 2021, event: "Alcohol Use Disorder comorbidity — 6 months outpatient group therapy, in remission", sensitive: true, reason: "substance_abuse" },
      { year: 2022, event: "Severe gastritis secondary to NSAID overuse during active addiction phase", sensitive: false },
      { year: 2023, event: "Naltrexone initiated for relapse prevention — ongoing compliance confirmed", sensitive: false },
    ],
    last_visit: "2026-01-08",
    primary_physician: "Dr. Suresh Pillai, Internal Medicine",
    // Scenario hint: severe abdominal pain → Privacy Firewall critical — NSAIDs/opioids contraindicated, must surface as Red Flag via clinical language only
    scenario_tag: "substance_redflg"
  },

  "55667788990011": {
    id: "55667788990011",
    name: "Meera Nair",
    age: 63,
    dob: "1961-09-30",
    sex: "Female",
    blood_type: "AB+",
    weight_kg: 68,
    height_cm: 158,
    contact: "+91-9812345678",
    emergency_contact: "Vijay Nair (Son) — +91-9900112233",
    allergies: ["Sulfa drugs", "Contrast dye (iodine-based — prior anaphylaxis)"],
    current_medications: [
      "Warfarin 5mg (daily — INR target 2.0–3.0)",
      "Ramipril 5mg (once daily)",
      "Furosemide 40mg (once daily)",
      "Digoxin 0.125mg (once daily)"
    ],
    chronic_conditions: ["Atrial Fibrillation (AF)", "Congestive Heart Failure (CHF) — NYHA Class II", "Hypertension"],
    medical_history: [
      { year: 2018, event: "Ischaemic Stroke — mild, full recovery, anticoagulation initiated", sensitive: false },
      { year: 2020, event: "Elective cardioversion for AF — successful rhythm restoration, reverted to AF within 6 months", sensitive: false },
      { year: 2022, event: "Breast cancer screening — BRCA1 positive, underwent bilateral prophylactic mastectomy", sensitive: true, reason: "reproductive" },
      { year: 2023, event: "Post-surgical depression following mastectomy — 9 months SSRI therapy (Escitalopram), now off medication, stable", sensitive: true, reason: "psychiatric" },
      { year: 2024, event: "CHF exacerbation — hospitalised 5 days, diuretics adjusted", sensitive: false },
    ],
    last_visit: "2026-03-22",
    primary_physician: "Dr. Ramesh Gupta, Cardiologist",
    // Scenario hint: sudden dyspnoea / breathlessness → Red Flag (AF, CHF, warfarin interaction, contrast allergy critical)
    scenario_tag: "multi_redflg"
  }
};

// Helper: look up patient by ID
function getPatientById(id) {
  return PATIENT_DATABASE[id.replace(/\s/g, "").trim()] || null;
}

// Helper: get demo IDs for the UI hint
function getDemoIds() {
  return Object.keys(PATIENT_DATABASE).map(id => ({
    id,
    name: PATIENT_DATABASE[id].name,
    age: PATIENT_DATABASE[id].age,
    scenario: PATIENT_DATABASE[id].scenario_tag
  }));
}
