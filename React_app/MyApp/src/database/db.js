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
        pregnancy_verified INTEGER DEFAULT 0,
        verification_status TEXT DEFAULT 'none',
        verification_method TEXT,
        pregnancy_doc_type TEXT,
        pregnancy_doc_uri TEXT,
        latitude REAL,
        longitude REAL,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS pregnancy_records (
        phone TEXT PRIMARY KEY NOT NULL,
        edd TEXT,
        pregnancy_start_date TEXT,
        risk_level TEXT DEFAULT 'normal',
        created_at TEXT,
        FOREIGN KEY(phone) REFERENCES patient_profiles(phone)
      );

      CREATE TABLE IF NOT EXISTS pregnancy_week_data (
        week INTEGER PRIMARY KEY NOT NULL,
        baby_size TEXT,
        development TEXT,
        weight TEXT,
        length TEXT
      );

      CREATE TABLE IF NOT EXISTS anc_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        visit_number INTEGER NOT NULL,
        scheduled_date TEXT,
        status TEXT DEFAULT 'upcoming', -- upcoming, completed, locked
        weight REAL,
        bp TEXT,
        hb REAL,
        ultrasound TEXT,
        notes TEXT,
        FOREIGN KEY(phone) REFERENCES patient_profiles(phone)
      );

      CREATE TABLE IF NOT EXISTS daily_health_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        iron_taken INTEGER DEFAULT 0,
        folic_taken INTEGER DEFAULT 0,
        kick_count INTEGER DEFAULT 0,
        UNIQUE(phone, date),
        FOREIGN KEY(phone) REFERENCES patient_profiles(phone)
      );

      -- Stores uploaded pregnancy documents and OCR results
      -- Used by CHW dashboard to view submitted documents for verification
      CREATE TABLE IF NOT EXISTS pregnancy_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        doc_type TEXT,
        doc_base64 TEXT,
        raw_ocr_text TEXT,
        extracted_edd TEXT,
        extracted_lmp TEXT,
        ocr_confidence TEXT DEFAULT 'low',
        submitted_at TEXT,
        FOREIGN KEY(phone) REFERENCES patient_profiles(phone)
      );

      -- Seed initial week data if missing
      INSERT OR IGNORE INTO pregnancy_week_data (week, baby_size, development, weight, length) VALUES
      (8, 'Raspberry 🫐', 'The heart is beating at 150 BPM. Fingers and toes are forming.', '1g', '1.6cm'),
      (12, 'Lime 🍋', 'Baby is fully formed. Reflexes are developing.', '14g', '5.4cm'),
      (20, 'Banana 🍌', 'Baby can swallow. You might feel the first kicks.', '300g', '25cm'),
      (24, 'Corn 🌽', 'Lungs are developing. Baby can hear your voice.', '600g', '30cm'),
      (32, 'Pineapple 🍍', 'Lungs are practicing breathing. Baby is very active.', '1.7kg', '42cm'),
      (40, 'Watermelon 🍉', 'Full term! Baby is ready to meet the world.', '3.5kg', '51cm');

      CREATE INDEX IF NOT EXISTS idx_drug_synced ON drug_usage(synced);
      CREATE INDEX IF NOT EXISTS idx_synced ON patients(synced);
      CREATE INDEX IF NOT EXISTS idx_disease ON patients(predicted_disease);
      CREATE INDEX IF NOT EXISTS idx_profile_phone ON patient_profiles(phone);
      CREATE INDEX IF NOT EXISTS idx_pregnancy_phone ON pregnancy_records(phone);
      CREATE INDEX IF NOT EXISTS idx_anc_phone ON anc_visits(phone);
    `);

    // We can't use dynamic PRAGMA checks easily in a single execAsync without complex logic.
    // However, SQLite ALTER TABLE ADD COLUMN IF NOT EXISTS is not standard.
    // A robust way in Expo SQLite is to wrap individual alters in try-catch or just run them.
    try { await db.execAsync(`ALTER TABLE patient_profiles ADD COLUMN pregnancy_verified INTEGER DEFAULT 0;`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE patient_profiles ADD COLUMN verification_status TEXT DEFAULT 'none';`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE patient_profiles ADD COLUMN verification_method TEXT;`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE patient_profiles ADD COLUMN pregnancy_doc_type TEXT;`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE patient_profiles ADD COLUMN pregnancy_doc_uri TEXT;`); } catch (e) { }

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Database initialization error:", error);
  }
};

export default db;