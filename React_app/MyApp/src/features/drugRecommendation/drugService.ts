import { DRUG_DATA, DrugItem } from "./drugData";
import { saveDrugUsage, DrugUsageRecord } from "./drugRepository";
import NetInfo from "@react-native-community/netinfo";
import { predictRiskOnline } from "./riskApi";
import { predictRiskOffline } from "./fallbackEngine";
import { generateAdvisory } from "./advisoryEngine";

interface DrugResponse {
  risk_level?: string;
  confidence?: number | null;
  medicine?: string;
  dosage?: string;
  warnings?: string;
  error?: string;
}

export const getDrugRecommendation = async (
  disease: string,
  ageGroup: "Adult" | "Child",
  allergyFlag: boolean,
  temp: string,
  weakness: string,
  vomiting: string
): Promise<DrugResponse> => {

  // 🔹 1. Find Drug Advisory
  const drug: DrugItem | undefined = DRUG_DATA.find(
    item => item.disease.toLowerCase() === disease.toLowerCase()
  );

  if (!drug) {
    return { error: "No recommendation found. Please visit PHC." };
  }

  const dosage =
    ageGroup === "Adult"
      ? drug.dosage_adult
      : drug.dosage_child;

  // 🔹 2. Save usage locally (non-blocking — DB might not be ready yet)
  try {
    const record: DrugUsageRecord = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      disease,
      medicine: drug.medicine,
      age_group: ageGroup,
      allergy_flag: allergyFlag ? 1 : 0,
      timestamp: new Date().toISOString()
    };
    await saveDrugUsage(record);
  } catch (dbErr) {
    console.warn("DB save failed (non-fatal):", dbErr);
  }

  // 🔹 3. Risk Prediction (Online / Offline)
  let isConnected = false;
  try {
    const netState = await NetInfo.fetch();
    isConnected = netState.isConnected ?? false;
  } catch (netErr) {
    console.warn("NetInfo failed, defaulting to offline:", netErr);
  }

  let riskResult;

  if (isConnected) {
    try {
      const onlineResult = await predictRiskOnline({
        disease,
        temp,
        weakness,
        vomiting,
        age: ageGroup
      });

      riskResult =
        onlineResult ??
        predictRiskOffline({
          temp,
          weakness,
          vomiting,
          age: ageGroup
        });

      console.log("Online ML used");
    } catch (err) {
      console.log("ML failed, using fallback");
      riskResult = predictRiskOffline({
        temp,
        weakness,
        vomiting,
        age: ageGroup
      });
    }
  } else {
    console.log("Offline mode - using fallback engine");
    riskResult = predictRiskOffline({
      temp,
      weakness,
      vomiting,
      age: ageGroup
    });
  }

  const advisory = generateAdvisory(
    drug,
    riskResult.risk_level,
    ageGroup
  );

  // 🔹 4. Return Combined Response
  return {
    risk_level: riskResult.risk_level,
    confidence: riskResult.confidence ?? null,
    ...advisory
  };
};