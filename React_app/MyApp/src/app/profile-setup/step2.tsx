import React, { useState } from 'react';
import { Text, TextInput } from '@/components/AppText';

import { View, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import db from '../../database/db';

// ─── Data ─────────────────────────────────────────────────────────────────────
const ALLERGY_OPTIONS = ['Penicillin', 'Sulfa', 'Aspirin', 'None', '+ Other'];
const CONDITION_OPTIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'None'];

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
    const pct = (step / total) * 100;
    return (
        <View style={pb.track}>
            <View style={[pb.fill, { width: `${pct}%` as any }]} />
        </View>
    );
}
const pb = StyleSheet.create({
    track: {
        height: 4,
        backgroundColor: '#1E3A5A',
        borderRadius: 2,
        overflow: 'hidden',
    },
    fill: {
        height: 4,
        backgroundColor: '#3D8EFF',
        borderRadius: 2,
    },
});

// ─── Multi-Select Chip ────────────────────────────────────────────────────────
function MultiChip({
    label,
    selected,
    onToggle,
}: {
    label: string;
    selected: boolean;
    onToggle: () => void;
}) {
    return (
        <TouchableOpacity
            style={[chip.base, selected && chip.active]}
            onPress={onToggle}
            activeOpacity={0.8}
        >
            <Text style={[chip.text, selected && chip.textActive]}>{label}</Text>
        </TouchableOpacity>
    );
}
const chip = StyleSheet.create({
    base: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: '#1E3A5A',
        backgroundColor: '#132236',
        marginRight: 8,
        marginBottom: 10,
    },
    active: { borderColor: '#3D8EFF', backgroundColor: 'transparent' },
    text: { color: '#9BB4D0', fontSize: 14, fontWeight: '500' },
    textActive: { color: '#3D8EFF', fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Step2Screen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();

    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [allergies, setAllergies] = useState<string[]>([]);
    const [conditions, setConditions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const toggleAllergy = (item: string) => {
        if (item === 'None') {
            setAllergies(['None']);
            return;
        }
        setAllergies((prev) => {
            const withoutNone = prev.filter((a) => a !== 'None');
            return prev.includes(item)
                ? withoutNone.filter((a) => a !== item)
                : [...withoutNone, item];
        });
    };

    const toggleCondition = (item: string) => {
        if (item === 'None') {
            setConditions(['None']);
            return;
        }
        setConditions((prev) => {
            const withoutNone = prev.filter((c) => c !== 'None');
            return prev.includes(item)
                ? withoutNone.filter((c) => c !== item)
                : [...withoutNone, item];
        });
    };

    const handleNext = async () => {
        if (!emergencyPhone.trim() || emergencyPhone.trim().length < 10) {
            Alert.alert('Required', 'Please enter a valid 10-digit emergency contact number.');
            return;
        }
        setSaving(true);
        try {
            await db.runAsync(
                `UPDATE patient_profiles
         SET emergency_contact = ?,
             known_allergies = ?,
             chronic_conditions = ?,
             updated_at = ?
         WHERE phone = ?`,
                [
                    emergencyPhone.trim(),
                    JSON.stringify(allergies),
                    JSON.stringify(conditions),
                    new Date().toISOString(),
                    phone ?? '',
                ]
            );
            router.push({
                pathname: '/profile-setup/step3' as any,
                params: { phone: phone ?? '' },
            });
        } catch (err) {
            console.error('Step2 save error:', err);
            Alert.alert('Error', 'Could not save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile Setup</Text>
                    <View style={{ width: 36 }} />
                </Animated.View>

                {/* ── Step Label + Progress ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.stepRow}>
                    <Text style={styles.stepLabel}>Emergency &amp; Health Info</Text>
                    <Text style={styles.stepCount}>Step 2 of 3</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.progressWrap}>
                    <ProgressBar step={2} total={3} />
                </Animated.View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Emergency Contact ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(150)}>
                        <Text style={styles.sectionTitle}>Emergency Contact</Text>
                        <Text style={styles.sectionSubtitle}>
                            Who should we contact in case of an emergency?
                        </Text>

                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.phoneInputRow}>
                            <Text style={styles.phoneIcon}>📞</Text>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="(555) 000-0000"
                                placeholderTextColor="#4A6280"
                                keyboardType="phone-pad"
                                value={emergencyPhone}
                                onChangeText={setEmergencyPhone}
                                maxLength={10}
                            />
                        </View>
                    </Animated.View>

                    {/* ── Known Allergies ── */}
                    <Animated.View entering={FadeInUp.duration(400).delay(220)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Known Allergies</Text>
                        <View style={styles.chipRow}>
                            {ALLERGY_OPTIONS.map((item) => (
                                <MultiChip
                                    key={item}
                                    label={item}
                                    selected={allergies.includes(item)}
                                    onToggle={() => toggleAllergy(item)}
                                />
                            ))}
                        </View>
                    </Animated.View>

                    {/* ── Chronic Conditions ── */}
                    <Animated.View entering={FadeInUp.duration(400).delay(290)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Chronic Conditions</Text>
                        <View style={styles.chipRow}>
                            {CONDITION_OPTIONS.map((item) => (
                                <MultiChip
                                    key={item}
                                    label={item}
                                    selected={conditions.includes(item)}
                                    onToggle={() => toggleCondition(item)}
                                />
                            ))}
                        </View>
                    </Animated.View>

                    <View style={{ height: 110 }} />
                </ScrollView>

                {/* ── Next Button + Security Note ── */}
                <Animated.View entering={FadeInUp.duration(400).delay(350)} style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
                        onPress={handleNext}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.nextBtnText}>Next  →</Text>
                    </TouchableOpacity>
                    <Text style={styles.securityNote}>🔒  Your medical data is encrypted and secure.</Text>
                </Animated.View>

            </SafeAreaView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1B2E' },
    safeArea: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center' },
    backText: { fontSize: 22, color: '#FFFFFF', fontWeight: '600' },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    stepRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 6,
    },
    stepLabel: { fontSize: 14, color: '#3D8EFF', fontWeight: '600' },
    stepCount: { fontSize: 14, color: '#9BB4D0', fontWeight: '500' },
    progressWrap: { paddingHorizontal: 24, marginBottom: 4 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 20 },

    section: { marginTop: 28 },

    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#9BB4D0',
        lineHeight: 20,
        marginBottom: 16,
    },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#C8D8EA',
        marginBottom: 10,
    },
    phoneInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#132236',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#1E3A5A',
        paddingHorizontal: 18,
        paddingVertical: Platform.OS === 'ios' ? 16 : 13,
        gap: 10,
    },
    phoneIcon: { fontSize: 18 },
    phoneInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '400',
    },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },

    bottomBar: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 8 : 16,
        paddingTop: 12,
        backgroundColor: '#0D1B2E',
        alignItems: 'center',
    },
    nextBtn: {
        width: '100%',
        backgroundColor: '#3D8EFF',
        paddingVertical: 18,
        borderRadius: 50,
        alignItems: 'center',
        shadowColor: '#3D8EFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 10,
    },
    nextBtnDisabled: { opacity: 0.6 },
    nextBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    securityNote: { fontSize: 12, color: '#6B8BAE', textAlign: 'center' },
});
