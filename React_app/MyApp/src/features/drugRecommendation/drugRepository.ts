import db from "../../database/db";

export interface DrugUsageRecord {
  id: string;
  disease: string;
  medicine: string;
  age_group: string;
  allergy_flag: number;
  timestamp: string;
}

export const saveDrugUsage = async (
  record: DrugUsageRecord
): Promise<void> => {
  await db.runAsync(
    `INSERT INTO drug_usage 
     (id, disease, medicine, age_group, allergy_flag, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0);`,
    [
      record.id,
      record.disease,
      record.medicine,
      record.age_group,
      record.allergy_flag,
      record.timestamp
    ]
  );
};