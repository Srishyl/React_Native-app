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

      CREATE INDEX IF NOT EXISTS idx_synced ON patients(synced);
      CREATE INDEX IF NOT EXISTS idx_disease ON patients(predicted_disease);
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Database initialization error:", error);
  }
};

export default db;