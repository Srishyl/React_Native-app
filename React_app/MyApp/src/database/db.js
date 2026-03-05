import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('health_app.db');

export const initializeDatabase = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY NOT NULL,
        symptoms TEXT,
        predicted_disease TEXT,
        severity_level TEXT,
        confidence_score REAL,
        recommended_drug TEXT,
        dosage_info TEXT,
        timestamp TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS phc (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        latitude REAL,
        longitude REAL,
        current_patients INTEGER,
        available_doctors INTEGER,
        last_updated TEXT
      );

      CREATE TABLE IF NOT EXISTS drugs (
        id TEXT PRIMARY KEY NOT NULL,
        disease TEXT,
        medicine TEXT,
        dosage_adult TEXT,
        dosage_child TEXT,
        warnings TEXT
      );

      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY NOT NULL,
        monthly_cases TEXT,
        top_diseases TEXT,
        medicine_demand TEXT,
        last_updated TEXT
      );

      CREATE TABLE IF NOT EXISTS drug_usage (
        id TEXT PRIMARY KEY NOT NULL,
        disease TEXT,
        medicine TEXT,
        age_group TEXT,
        allergy_flag INTEGER,
        timestamp TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS patient_sessions (
        phone TEXT PRIMARY KEY NOT NULL,
        otp TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`);

    // Safe Migration: Drop old table if "id" column is missing
    try {
      const tableInfo = await db.getAllAsync("PRAGMA table_info(patient_profiles)");
      if (tableInfo && tableInfo.length > 0) {
        const hasId = tableInfo.some((col) => col.name === 'id');
        if (!hasId) {
          await db.execAsync("DROP TABLE IF EXISTS patient_profiles");
        }
      }
    } catch (e) { }

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS patient_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        full_name TEXT,
        age TEXT,
        gender TEXT,
        village TEXT,
        pincode TEXT,
        language_preference TEXT,
        emergency_contact TEXT,
        known_allergies TEXT,
        chronic_conditions TEXT,
        care_mode TEXT,
        profile_complete INTEGER DEFAULT 0,
        latitude REAL,
        longitude REAL,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_drug_synced ON drug_usage(synced);
      CREATE INDEX IF NOT EXISTS idx_synced ON patients(synced);
      CREATE INDEX IF NOT EXISTS idx_disease ON patients(predicted_disease);
      CREATE INDEX IF NOT EXISTS idx_profile_phone ON patient_profiles(phone);
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Database initialization error:", error);
  }
};

export default db;