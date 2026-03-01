-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  symptoms TEXT,
  predicted_disease TEXT,
  severity_level TEXT,
  confidence_score REAL,
  recommended_drug TEXT,
  dosage_info TEXT,
  timestamp TEXT,
  synced INTEGER DEFAULT 0
);

-- PHC Table
CREATE TABLE IF NOT EXISTS phc (
  id TEXT PRIMARY KEY,
  name TEXT,
  latitude REAL,
  longitude REAL,
  current_patients INTEGER,
  available_doctors INTEGER,
  last_updated TEXT
);

-- Drugs Table
CREATE TABLE IF NOT EXISTS drugs (
  id TEXT PRIMARY KEY,
  disease TEXT,
  medicine TEXT,
  dosage_adult TEXT,
  dosage_child TEXT,
  warnings TEXT
);

-- Analytics Table
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  monthly_cases TEXT,
  top_diseases TEXT,
  medicine_demand TEXT,
  last_updated TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_synced ON patients(synced);
CREATE INDEX IF NOT EXISTS idx_disease ON patients(predicted_disease);