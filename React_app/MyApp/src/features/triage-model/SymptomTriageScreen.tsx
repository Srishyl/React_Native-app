import React, { useState } from 'react';
import { TextInput } from '@/components/AppText';

import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SYMPTOMS as INITIAL_SYMPTOMS } from './Symptoms';
import { getTriageResult, TriageResult } from './TriageService';

export default function SymptomTriageScreen() {
    const router = useRouter();
    const [availableSymptoms, setAvailableSymptoms] = useState(INITIAL_SYMPTOMS);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TriageResult | null>(null);
    const [showInput, setShowInput] = useState(false);
    const [customSymptom, setCustomSymptom] = useState('');

    const toggleSymptom = (id: string) => {
        if (selectedSymptoms.includes(id)) {
            setSelectedSymptoms(selectedSymptoms.filter(s => s !== id));
        } else {
            setSelectedSymptoms([...selectedSymptoms, id]);
        }
    };

    const addCustomSymptom = () => {
        if (customSymptom.trim()) {
            const id = customSymptom.toLowerCase().replace(/\s+/g, '_');
            if (!availableSymptoms.find(s => s.id === id)) {
                setAvailableSymptoms([...availableSymptoms, { id, label: customSymptom, icon: '🩹' }]);
            }
            if (!selectedSymptoms.includes(id)) {
                setSelectedSymptoms([...selectedSymptoms, id]);
            }
            setCustomSymptom('');
            setShowInput(false);
        }
    };

    const handleCheck = async () => {
        if (selectedSymptoms.length === 0) return;
        setLoading(true);
        try {
            const triageResult = await getTriageResult(selectedSymptoms);
            setResult(triageResult);
        } catch (error) {
            console.error('Triage check failed:', error);
            // Fallback UI or error state could be added here
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSelectedSymptoms([]);
        setResult(null);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Emergency': return '#D12D2D';
            case 'Moderate': return '#F57C00';
            case 'Mild': return '#388E3C';
            default: return '#666';
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Symptom Triage', headerShadowVisible: false, headerShown: false }} />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
                        <ThemedText style={styles.title}>Symptom Checker</ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Select symptoms or add your own to get a health assessment.
                        </ThemedText>
                    </Animated.View>

                    {!result ? (
                        <Animated.View entering={FadeInUp.delay(200)} style={styles.symptomsSection}>
                            <View style={styles.chipGrid}>
                                {availableSymptoms.map((symptom) => {
                                    const isSelected = selectedSymptoms.includes(symptom.id);
                                    return (
                                        <TouchableOpacity
                                            key={symptom.id}
                                            style={[styles.symptomChip, isSelected && styles.symptomChipSelected]}
                                            onPress={() => toggleSymptom(symptom.id)}
                                        >
                                            <ThemedText style={[styles.symptomLabel, isSelected && styles.symptomLabelSelected]}>
                                                {symptom.label}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}

                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => setShowInput(!showInput)}
                                >
                                    <ThemedText style={styles.addButtonIcon}>{showInput ? '✕' : '+'}</ThemedText>
                                </TouchableOpacity>
                            </View>

                            {showInput && (
                                <Animated.View entering={FadeInDown} style={styles.inputRow}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Type symptom (e.g. Headache)"
                                        placeholderTextColor="#64748B"
                                        value={customSymptom}
                                        onChangeText={setCustomSymptom}
                                        autoFocus
                                        onSubmitEditing={addCustomSymptom}
                                    />
                                    <TouchableOpacity style={styles.addSubmitButton} onPress={addCustomSymptom}>
                                        <ThemedText style={styles.addSubmitText}>Add</ThemedText>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}

                            <TouchableOpacity
                                style={[styles.checkButton, selectedSymptoms.length === 0 && styles.checkButtonDisabled]}
                                onPress={handleCheck}
                                disabled={selectedSymptoms.length === 0 || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <ThemedText style={styles.checkButtonText}>Analyse Symptoms</ThemedText>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <Animated.View entering={FadeInUp} style={styles.resultCard}>
                            <View style={styles.resultHeader}>
                                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(result.severity) }]}>
                                    <ThemedText style={styles.severityText}>{result.severity}</ThemedText>
                                </View>
                                <View style={styles.confidenceBox}>
                                    <ThemedText style={styles.confidenceLabel}>Confidence Score</ThemedText>
                                    <ThemedText style={styles.confidenceValue}>{((result.confidence_score || 0) * 100).toFixed(1)}%</ThemedText>
                                </View>
                            </View>

                            <ThemedText style={styles.resultTitle}>Probable Disease: {result.disease}</ThemedText>

                            <View style={styles.recommendationBox}>
                                <ThemedText style={styles.recommendationTitle}>Recommended Action:</ThemedText>
                                <ThemedText style={styles.recommendationText}>{result.recommendation}</ThemedText>
                            </View>

                            {/* Hook for Drug Recommendation Flow */}
                            {result.drugs && result.drugs.length > 0 && (
                                <View style={styles.drugSection}>
                                    <ThemedText style={styles.drugSectionTitle}>💊 Initial Guidance:</ThemedText>
                                    {result.drugs.map((drug, idx) => (
                                        <View key={idx} style={styles.drugItem}>
                                            <ThemedText style={styles.drugName}>{drug.name}</ThemedText>
                                            <ThemedText style={styles.drugDosage}>Dosage: {drug.dosage}</ThemedText>
                                            <ThemedText style={styles.drugWarning}>⚠ {drug.warnings}</ThemedText>
                                        </View>
                                    ))}
                                    <ThemedText style={styles.medicalDisclaimerText}>
                                        ⚠ Consult a certified doctor before consumption.
                                    </ThemedText>
                                </View>
                            )}

                            {/* Hook for PHC Load Balancing Flow */}
                            {(result.severity === 'Emergency' || result.severity === 'Moderate') && (
                                <TouchableOpacity
                                    style={styles.phcButton}
                                    onPress={() => {
                                        alert('Connecting to PHC Load Balancing System...\n(Feature integration pending implementation)');
                                    }}
                                >
                                    <ThemedText style={styles.phcButtonText}>📍 Find Nearest PHC</ThemedText>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.resetButton} onPress={reset}>
                                <ThemedText style={styles.resetButtonText}>Check Other Symptoms</ThemedText>
                            </TouchableOpacity>


                        </Animated.View>
                    )}

                    <TouchableOpacity
                        style={[styles.resetButton, { marginTop: 24 }]}
                        onPress={() => router.back()}
                    >
                        <ThemedText style={styles.resetButtonText}>Back to Home</ThemedText>
                    </TouchableOpacity>

                    <View style={styles.disclaimer}>
                        <ThemedText style={styles.disclaimerTitle}>⚖️ Preliminary AI guidance only.</ThemedText>
                        <ThemedText style={styles.disclaimerText}>
                            System does NOT replace doctor diagnosis. Always consult a professional for medical emergencies.
                        </ThemedText>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D1522',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    header: {
        marginBottom: 24,
        marginTop: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        lineHeight: 24,
    },
    symptomsSection: {
        flex: 1,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    symptomChip: {
        width: '48%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderWidth: 1.5,
        borderColor: '#334155',
        marginBottom: 12,
    },
    symptomChipSelected: {
        backgroundColor: '#3D8EFF',
        borderColor: '#3D8EFF',
    },
    symptomLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94A3B8',
        textAlign: 'center',
    },
    symptomLabelSelected: {
        color: '#FFFFFF',
    },
    addButton: {
        width: '48%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        paddingVertical: 10,
        borderWidth: 1.5,
        borderColor: '#334155',
        borderStyle: 'dashed',
        marginBottom: 12,
    },
    addButtonIcon: {
        fontSize: 24,
        color: '#3D8EFF',
        fontWeight: '400',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 30,
        paddingLeft: 24,
        paddingRight: 8,
        paddingVertical: 8,
        marginBottom: 32,
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        height: 44,
    },
    addSubmitButton: {
        backgroundColor: '#3D8EFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        marginLeft: 8,
    },
    addSubmitText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    checkButton: {
        backgroundColor: '#3D8EFF',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 6,
        marginTop: 10,
    },
    checkButtonDisabled: {
        backgroundColor: '#1E293B',
    },
    checkButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    resultCard: {
        backgroundColor: '#1E293B',
        padding: 30,
        borderRadius: 32,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    severityBadge: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 25,
    },
    severityText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    confidenceBox: {
        alignItems: 'flex-end',
    },
    confidenceLabel: {
        fontSize: 10,
        color: '#94A3B8',
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    confidenceValue: {
        fontSize: 16,
        color: '#38BDF8',
        fontWeight: '800',
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 24,
    },
    recommendationBox: {
        backgroundColor: '#111A2C',
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#38BDF8',
    },
    recommendationTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#E2E8F0',
        marginBottom: 10,
    },
    recommendationText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#CBD5E1',
    },
    drugSection: {
        backgroundColor: '#111A2C',
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#334155',
    },
    drugSectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#38BDF8',
        marginBottom: 12,
    },
    drugItem: {
        marginBottom: 12,
    },
    drugName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    drugDosage: {
        fontSize: 14,
        color: '#94A3B8',
    },
    drugWarning: {
        fontSize: 12,
        color: '#F87171',
        fontWeight: '600',
        marginTop: 2,
    },
    medicalDisclaimerText: {
        fontSize: 11,
        color: '#64748B',
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    phcButton: {
        backgroundColor: '#3D8EFF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    phcButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    resetButton: {
        backgroundColor: '#1E293B',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#3D8EFF',
        fontWeight: '700',
        fontSize: 16,
    },
    disclaimer: {
        marginTop: 40,
        paddingBottom: 20,
        alignItems: 'center',
    },
    disclaimerTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#F87171',
        marginBottom: 4,
    },
    disclaimerText: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});
