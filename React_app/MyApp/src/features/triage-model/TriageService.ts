import { MOCK_TRIAGE_DATA, TriageRule, RECOMMENDATIONS, MOCK_DRUGS } from './Symptoms';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import db from '@/database/db';

export interface DrugRecommendation {
    name: string;
    dosage: string;
    warnings: string;
}

export interface TriageResult {
    disease: string;
    severity: 'Emergency' | 'Moderate' | 'Mild';
    recommendation: string;
    confidence_score: number;
    drugs?: DrugRecommendation[];
    synced?: boolean;
    localId?: string;
    isBackendResult?: boolean; // Flag to check if result came from FastAPI
}

/**
 * Persist triage result to SQLite
 */
const saveTriageToLocalDB = async (result: TriageResult, symptoms: string[]) => {
    const id = result.localId || `triage_${Date.now()}`;
    const symptomsStr = symptoms.join(', ');
    const drugInfo = result.drugs && result.drugs.length > 0 ? result.drugs[0] : null;

    try {
        await db.runAsync(
            `INSERT INTO patients (
                id, symptoms, predicted_disease, severity_level, 
                confidence_score, recommended_drug, dosage_info, 
                timestamp, synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                symptomsStr,
                result.disease,
                result.severity,
                result.confidence_score,
                drugInfo?.name || '',
                drugInfo?.dosage || '',
                new Date().toISOString(),
                result.synced ? 1 : 0
            ]
        );
        console.log(`Saved triage ${id} to SQLite (synced: ${result.synced})`);
    } catch (error) {
        console.error('Error saving to SQLite:', error);
    }
};

export const getTriageResult = async (selectedSymptoms: string[]): Promise<TriageResult | null> => {
    if (selectedSymptoms.length === 0) return null;

    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

    let result: TriageResult | null = null;

    if (isOnline) {
        try {
            /**
             * 🌐 ONLINE FLOW: Sending data to FastAPI
             */
            console.log('Attempting Online Triage with FastAPI...');

            // Placeholder: Replace with actual IP when server is up
            // Example: const API_URL = 'http://192.168.1.5:8000/predict';
            /*
            const response = await fetch('YOUR_FASTAPI_URL/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symptoms: selectedSymptoms })
            });

            if (response.ok) {
                const data = await response.json();
                result = {
                    disease: data.predicted_disease,
                    severity: data.severity_level,
                    confidence_score: data.confidence_score,
                    recommendation: data.recommended_action || (RECOMMENDATIONS as any)[data.severity_level],
                    drugs: data.suggested_drugs || (MOCK_DRUGS as any)[data.predicted_disease],
                    synced: true,
                    localId: `triage_${Date.now()}`,
                    isBackendResult: true
                };
            }
            */

            // For now, we simulate that API is not yet connected to continue offline development
            // throw new Error("API Connection not established");

        } catch (error) {
            console.warn('FastAPI Flow failed, falling back to local logic:', error);
        }
    }

    /**
     * 🔄 OFFLINE / FALLBACK FLOW: Match locally
     */
    if (!result) {
        console.log('Executing Offline Fallback Triage...');
        let bestMatch: TriageRule | null = null;
        let maxMatchCount = 0;

        for (const rule of MOCK_TRIAGE_DATA) {
            const matchCount = rule.symptoms.filter(s => selectedSymptoms.includes(s)).length;
            if (matchCount > maxMatchCount) {
                maxMatchCount = matchCount;
                bestMatch = rule;
            }
        }

        if (bestMatch && maxMatchCount > 0) {
            result = {
                disease: bestMatch.disease,
                severity: bestMatch.severity,
                recommendation: (RECOMMENDATIONS as any)[bestMatch.severity],
                confidence_score: parseFloat((0.6 + (maxMatchCount / bestMatch.symptoms.length * 0.4)).toFixed(2)),
                drugs: (MOCK_DRUGS as any)[bestMatch.disease],
                synced: false, // Local classification is marked unsynced
                localId: `triage_${Date.now()}`,
                isBackendResult: false
            };
        } else {
            result = {
                disease: "General Health Concern",
                severity: "Moderate",
                recommendation: "Please consult a health worker for further evaluation.",
                confidence_score: 0.45,
                synced: false,
                localId: `triage_${Date.now()}`,
                isBackendResult: false
            };
        }
    }

    // 💾 Save to SQLite before returning (Offline-First)
    if (result) {
        await saveTriageToLocalDB(result, selectedSymptoms);
    }

    return result;
};
