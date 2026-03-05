import triageData from '@/database/seeds/triage.json';

export const SYMPTOMS = triageData.SYMPTOMS;

export interface TriageRule {
    symptoms: string[];
    disease: string;
    severity: 'Emergency' | 'Moderate' | 'Mild';
}

export const MOCK_TRIAGE_DATA = triageData.MOCK_TRIAGE_DATA as TriageRule[];

export const RECOMMENDATIONS = (triageData as any).RECOMMENDATIONS;

export const MOCK_DRUGS = (triageData as any).MOCK_DRUGS;
