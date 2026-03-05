export interface DrugItem {
  disease: string;
  medicine: string;
  dosage_adult: string;
  dosage_child: string;
  warnings: string;
  avoid: string[];
  red_flags: string[];
  self_care: string[];
  follow_up_days: number;
}

export const DRUG_DATA: DrugItem[] = [
  {
    disease: "Dengue",
    medicine: "Paracetamol",
    dosage_adult: "500mg every 6 hours",
    dosage_child: "250mg every 6 hours",
    warnings: "Avoid NSAIDs",
    avoid: ["Ibuprofen", "Aspirin", "Diclofenac"],
    red_flags: ["Continuous vomiting", "Severe weakness", "Bleeding from gums/nose", "Abdominal pain", "Skin rash"],
    self_care: ["Drink ORS or coconut water", "Stay hydrated", "Rest properly", "Monitor platelet count"],
    follow_up_days: 2
  },
  {
    disease: "Cold",
    medicine: "Paracetamol + Cetirizine",
    dosage_adult: "Paracetamol 500mg + Cetirizine 10mg at night",
    dosage_child: "Paracetamol 250mg + Cetirizine 5mg at night",
    warnings: "Do not exceed 4 tablets per day",
    avoid: [],
    red_flags: ["Breathing difficulty", "High fever above 102°F", "Chest pain"],
    self_care: ["Drink warm fluids", "Rest", "Steam inhalation", "Honey with warm water"],
    follow_up_days: 3
  },
  {
    disease: "Malaria",
    medicine: "Chloroquine / Artemisinin combination",
    dosage_adult: "Chloroquine 600mg initially, then 300mg after 6hrs",
    dosage_child: "10mg/kg initially — consult PHC",
    warnings: "Must complete full course; consult PHC for exact regimen",
    avoid: ["Alcohol", "Self-stopping medication"],
    red_flags: ["High fever with chills", "Confusion or seizures", "Yellowing of eyes", "Dark urine", "Unconsciousness"],
    self_care: ["Use mosquito net", "Stay hydrated", "Take full medication course", "Avoid cold exposure"],
    follow_up_days: 3
  },
  {
    disease: "Typhoid",
    medicine: "Azithromycin",
    dosage_adult: "500mg once daily for 7 days",
    dosage_child: "10mg/kg once daily for 7 days",
    warnings: "Complete the full antibiotic course",
    avoid: ["Spicy food", "Raw vegetables", "Alcohol"],
    red_flags: ["Continuous high fever >103°F", "Severe abdominal pain", "Confusion", "Rectal bleeding"],
    self_care: ["Drink boiled water only", "Eat soft cooked food", "Rest completely", "Maintain hygiene"],
    follow_up_days: 7
  },
  {
    disease: "Diarrhea",
    medicine: "ORS + Zinc",
    dosage_adult: "ORS 1 sachet per loose motion, Zinc 20mg once daily",
    dosage_child: "ORS 100-200ml per loose motion, Zinc 10mg once daily",
    warnings: "Keep patient hydrated at all times",
    avoid: ["Dairy", "Fatty food", "Carbonated drinks"],
    red_flags: ["Blood in stool", "Sunken eyes", "No urination for 8+ hours", "High fever", "Severe vomiting"],
    self_care: ["Drink ORS frequently", "Eat banana and rice", "Boil water before drinking", "Wash hands frequently"],
    follow_up_days: 2
  },
  {
    disease: "Pneumonia",
    medicine: "Amoxicillin",
    dosage_adult: "500mg three times daily for 7 days",
    dosage_child: "25mg/kg twice daily — consult PHC",
    warnings: "Seek PHC immediately; home treatment is supplementary",
    avoid: ["Cold drinks", "Smoking exposure"],
    red_flags: ["Difficulty breathing", "Blue lips/fingernails", "High fever >104°F", "Rapid breathing", "Chest pain"],
    self_care: ["Rest in sitting position", "Steam inhalation", "Stay warm", "Drink warm fluids"],
    follow_up_days: 2
  },
  {
    disease: "Tuberculosis",
    medicine: "Refer to PHC for DOTS therapy",
    dosage_adult: "As prescribed under RNTCP program",
    dosage_child: "As prescribed by PHC doctor",
    warnings: "Never self-medicate TB — DOTS program is mandatory",
    avoid: ["Alcohol", "Smoking", "Contact with infants/elderly"],
    red_flags: ["Coughing blood", "Night sweats", "Rapid weight loss", "Persistent cough >2 weeks", "Chest pain"],
    self_care: ["Wear mask", "Separate utensils", "Ventilate room", "Nutritious diet"],
    follow_up_days: 1
  },
  {
    disease: "Chickenpox",
    medicine: "Calamine lotion + Paracetamol",
    dosage_adult: "Paracetamol 500mg every 6hrs, Calamine topically",
    dosage_child: "Paracetamol 250mg every 6hrs, Calamine topically",
    warnings: "Avoid Aspirin in children",
    avoid: ["Aspirin", "Scratching blisters", "Public contact"],
    red_flags: ["Blisters on eyes", "Difficulty breathing", "High fever >103°F", "Seizures", "Infected blisters (pus)"],
    self_care: ["Trim nails short", "Lukewarm oatmeal bath", "Loose cotton clothing", "Isolate from others"],
    follow_up_days: 5
  },
  {
    disease: "Hypertension",
    medicine: "Amlodipine",
    dosage_adult: "5mg once daily (morning)",
    dosage_child: "Not recommended — consult PHC",
    warnings: "Do not stop medication without doctor advice",
    avoid: ["Salt", "Fried food", "Alcohol", "Caffeine"],
    red_flags: ["Severe headache", "Blurred vision", "Chest pain", "Difficulty breathing", "Nosebleed"],
    self_care: ["Monitor BP daily", "Low-salt diet", "30 min walk daily", "Avoid stress", "Sleep 7-8 hours"],
    follow_up_days: 7
  },
  {
    disease: "Diabetes",
    medicine: "Metformin (consult PHC for dose)",
    dosage_adult: "500mg twice daily with meals — start low",
    dosage_child: "Pediatric diabetes — consult PHC immediately",
    warnings: "Regular blood sugar monitoring is essential",
    avoid: ["Sugar", "White rice in excess", "Fried snacks", "Fruit juice"],
    red_flags: ["Blood sugar >300", "Unconsciousness", "Excessive urination at night", "Foot wounds not healing", "Blurred vision"],
    self_care: ["Check blood sugar daily", "Walk 30 mins", "Eat small frequent meals", "Avoid barefoot walking"],
    follow_up_days: 7
  },
  {
    disease: "Asthma",
    medicine: "Salbutamol inhaler",
    dosage_adult: "2 puffs every 4-6 hours as needed",
    dosage_child: "1-2 puffs as needed with spacer",
    warnings: "Always carry inhaler; avoid triggers",
    avoid: ["Dust", "Smoke", "Cold air", "Pet dander", "Strong perfumes"],
    red_flags: ["No relief after 3 puffs", "Blue lips", "Cannot complete a sentence", "Silent chest (no wheeze)"],
    self_care: ["Identify and avoid triggers", "Keep inhaler handy", "Breathing exercises", "Use air purifier"],
    follow_up_days: 3
  },
  {
    disease: "Jaundice",
    medicine: "Supportive care (no specific drug)",
    dosage_adult: "Rest + dietary management",
    dosage_child: "Rest + consult PHC for bilirubin levels",
    warnings: "Must diagnose the cause — may indicate hepatitis or liver disease",
    avoid: ["Alcohol", "Fatty food", "Oily snacks", "Raw food"],
    red_flags: ["Deep yellow eyes/skin", "Dark urine", "Confusion", "Severe abdominal pain", "Bleeding tendency"],
    self_care: ["Drink lemon water", "Light diet (khichdi, fruits)", "Rest completely", "Avoid alcohol strictly"],
    follow_up_days: 3
  },
  {
    disease: "Anemia",
    medicine: "Iron + Folic Acid tablets",
    dosage_adult: "100mg iron + 0.5mg folic acid once daily",
    dosage_child: "3mg/kg/day iron — as prescribed",
    warnings: "Take with Vitamin C (lemon juice) for better absorption",
    avoid: ["Tea/coffee with meals", "Calcium supplements at same time"],
    red_flags: ["Extreme breathlessness", "Chest pain", "Rapid heart rate", "Fainting", "Very pale lips"],
    self_care: ["Eat iron-rich foods (spinach, jaggery, dal)", "Drink lemon water", "Rest", "Avoid tea after meals"],
    follow_up_days: 14
  },
  {
    disease: "Urinary Tract Infection",
    medicine: "Nitrofurantoin / Trimethoprim",
    dosage_adult: "Nitrofurantoin 100mg twice daily for 5 days",
    dosage_child: "Consult PHC — dose by weight",
    warnings: "Drink 2-3 litres of water daily",
    avoid: ["Spicy food", "Alcohol", "Holding urine for long"],
    red_flags: ["Fever >101°F with back pain", "Blood in urine", "Severe pain", "No urination", "Vomiting"],
    self_care: ["Drink plenty of water", "Urinate frequently", "Maintain hygiene", "Warm compress on abdomen"],
    follow_up_days: 5
  },
  {
    disease: "Conjunctivitis",
    medicine: "Chloramphenicol eye drops",
    dosage_adult: "1-2 drops every 4 hours for 5 days",
    dosage_child: "1 drop every 6 hours for 5 days",
    warnings: "Do not share towels or pillows",
    avoid: ["Eye rubbing", "Contact lenses", "Swimming", "Sharing eye items"],
    red_flags: ["Vision loss", "Severe eye pain", "Chemosis (swelling)", "High sensitivity to light"],
    self_care: ["Clean eyes with clean cotton", "Wash hands frequently", "Separate towels", "Avoid makeup"],
    follow_up_days: 5
  },
  {
    disease: "Skin Infection",
    medicine: "Cloxacillin + Mupirocin cream",
    dosage_adult: "Cloxacillin 500mg four times daily for 5 days",
    dosage_child: "25mg/kg/day in 4 divided doses",
    warnings: "Keep wound clean and covered",
    avoid: ["Scratching", "Sharing clothes", "Unclean water on wound"],
    red_flags: ["Spreading redness", "Fever", "Pus discharge", "Red streaks from wound"],
    self_care: ["Wash with antiseptic soap", "Cover with sterile dressing", "Keep dry", "Change dressing daily"],
    follow_up_days: 3
  },
  {
    disease: "Fever",
    medicine: "Paracetamol",
    dosage_adult: "500-1000mg every 6 hours as needed",
    dosage_child: "15mg/kg every 6 hours",
    warnings: "Investigate if fever lasts more than 3 days",
    avoid: ["Aspirin", "Over-covering with blankets"],
    red_flags: ["Fever >104°F", "Seizures", "Stiff neck", "No response to paracetamol", "Rash with fever"],
    self_care: ["Tepid sponging", "Rest", "Drink fluids", "Light clothing"],
    follow_up_days: 2
  },
  {
    disease: "Gastroenteritis",
    medicine: "ORS + Domperidone",
    dosage_adult: "ORS 500ml after each episode, Domperidone 10mg before meals",
    dosage_child: "ORS 150ml/kg/day, Domperidone 0.25mg/kg",
    warnings: "Stay hydrated; avoid dehydration",
    avoid: ["Spicy food", "Dairy", "Solid food initially"],
    red_flags: ["Blood in vomit", "No urine output", "Confusion", "Severe abdominal cramps"],
    self_care: ["Small sips of ORS", "BRAT diet (banana, rice, applesauce, toast)", "Rest", "Avoid solid food initially"],
    follow_up_days: 2
  },
  {
    disease: "Headache",
    medicine: "Paracetamol / Ibuprofen",
    dosage_adult: "Paracetamol 500mg or Ibuprofen 400mg every 6-8 hours",
    dosage_child: "Paracetamol 15mg/kg every 6 hours",
    warnings: "Avoid frequent use — may cause medication overuse headache",
    avoid: ["Bright screens", "Loud noise", "Caffeine overdose", "Alcohol"],
    red_flags: ["Worst headache of life (thunderclap)", "Stiff neck", "Vision changes", "Weakness on one side", "Fever with headache"],
    self_care: ["Rest in dark quiet room", "Apply cold compress", "Stay hydrated", "Manage stress"],
    follow_up_days: 2
  },
  {
    disease: "Scabies",
    medicine: "Permethrin 5% cream",
    dosage_adult: "Apply from neck down, leave 8-12 hours, wash off",
    dosage_child: "Apply on entire body including face, same duration",
    warnings: "All close contacts must be treated simultaneously",
    avoid: ["Scratching", "Sharing clothes/bedding", "Physical contact"],
    red_flags: ["Crust formation (Norwegian scabies)", "Secondary infection", "Fever"],
    self_care: ["Wash all clothing in hot water", "Iron bedding", "Treat all family members", "Cut nails short"],
    follow_up_days: 7
  }
];