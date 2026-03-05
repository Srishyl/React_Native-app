import React, { useState } from 'react';
import { Text } from '@/components/AppText';

import { View, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import db from '../../database/db';

type CareMode = 'normal' | 'pregnancy' | null;

// ─── Progress Bar (100%) ──────────────────────────────────────────────────────
function ProgressBar() {
    return (
        <View style={pb.track}>
            <View style={[pb.fill, { width: '100%' }]} />
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

// ─── Feature Row ──────────────────────────────────────────────────────────────
function FeatureRow({ text, color }: { text: string; color: string }) {
    return (
        <View style={fr.row}>
            <View style={[fr.dot, { backgroundColor: color }]}>
                <Text style={fr.tick}>✓</Text>
            </View>
            <Text style={fr.text}>{text}</Text>
        </View>
    );
}
const fr = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    tick: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    text: { fontSize: 14, color: '#C8D8EA', fontWeight: '400' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Step3Screen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [selected, setSelected] = useState<CareMode>(null);
    const [saving, setSaving] = useState(false);

    const handleContinue = async () => {
        if (!selected) {
            Alert.alert('Select a Mode', 'Please choose a care mode to continue.');
            return;
        }
        setSaving(true);
        console.log('DEBUG: Step 3 handleContinue - setting care mode:', selected, 'for phone:', phone);
        try {
            await db.runAsync(
                `UPDATE patient_profiles
         SET care_mode = ?,
             profile_complete = 1,
             updated_at = ?
         WHERE phone = ?`,
                [selected, new Date().toISOString(), phone ?? '']
            );

            console.log('DEBUG: Step 3 success. Navigating to final destination.');
            // Navigate to respective dashboard
            if (selected === 'pregnancy') {
                router.replace({
                    pathname: '/pregnancy-activation/step1' as any,
                    params: { phone: phone ?? '' }
                });
            } else {
                router.replace({
                    pathname: '/dashboards/normal' as any,
                    params: { phone: phone ?? '' }
                });
            }
        } catch (err) {
            console.error('Step3 save error:', err);
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
                    <Text style={styles.headerTitle}>HealthBridge</Text>
                    <View style={{ width: 36 }} />
                </Animated.View>

                {/* ── Step Label + Progress ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.stepRow}>
                    <Text style={styles.stepLabel}>Step 3 of 3</Text>
                    <Text style={styles.completeLabel}>100% Complete</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.progressWrap}>
                    <ProgressBar />
                </Animated.View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Title ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(150)}>
                        <Text style={styles.title}>Choose your care mode</Text>
                        <Text style={styles.subtitle}>
                            Tailor your experience based on your needs
                        </Text>
                    </Animated.View>

                    {/* ── Normal Mode Card ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(220)}>
                        <TouchableOpacity
                            activeOpacity={0.88}
                            onPress={() => setSelected('normal')}
                            style={[
                                styles.modeCard,
                                selected === 'normal' && styles.modeCardActiveBlue,
                            ]}
                        >
                            {/* RECOMMENDED badge */}
                            <View style={styles.badgeRow}>
                                <View style={styles.iconBox}>
                                    <Text style={styles.iconText}>💼</Text>
                                </View>
                                <View style={styles.recommendedBadge}>
                                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                                </View>
                            </View>

                            <Text style={styles.modeTitle}>Normal Mode</Text>
                            <Text style={styles.modeSubtitle}>For general health needs</Text>

                            <View style={styles.featureList}>
                                <FeatureRow text="Symptom check" color="#3D8EFF" />
                                <FeatureRow text="PHC booking" color="#3D8EFF" />
                                <FeatureRow text="Health records" color="#3D8EFF" />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.selectBtn,
                                    selected === 'normal' && styles.selectBtnActive,
                                ]}
                                onPress={() => setSelected('normal')}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.selectBtnText,
                                        selected === 'normal' && styles.selectBtnTextActive,
                                    ]}
                                >
                                    Select
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* ── Pregnancy Mode Card ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(300)}>
                        <TouchableOpacity
                            activeOpacity={0.88}
                            onPress={() => setSelected('pregnancy')}
                            style={[
                                styles.modeCard,
                                styles.modeCardPink,
                                selected === 'pregnancy' && styles.modeCardActivePink,
                            ]}
                        >
                            {/* Verification required badge */}
                            <View style={styles.badgeRow}>
                                <View style={[styles.iconBox, styles.iconBoxPink]}>
                                    <Text style={styles.iconText}>🤰</Text>
                                </View>
                                <View style={styles.verificationBadge}>
                                    <Text style={styles.verificationText}>🔒  Verification required</Text>
                                </View>
                            </View>

                            <Text style={[styles.modeTitle, styles.modeTitlePink]}>Pregnancy Mode</Text>
                            <Text style={styles.modeSubtitle}>For expecting mothers</Text>

                            <View style={styles.featureList}>
                                <FeatureRow text="ANC tracking" color="#F06292" />
                                <FeatureRow text="Nutrition guide" color="#F06292" />
                                <FeatureRow text="Danger sign alerts" color="#F06292" />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.selectBtn,
                                    styles.selectBtnPink,
                                    selected === 'pregnancy' && styles.selectBtnActivePink,
                                ]}
                                onPress={() => setSelected('pregnancy')}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.selectBtnText,
                                        styles.selectBtnTextPink,
                                        selected === 'pregnancy' && styles.selectBtnTextActivePink,
                                    ]}
                                >
                                    Select
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={{ height: 110 }} />
                </ScrollView>

                {/* ── Finish Button ── */}
                <Animated.View entering={FadeInUp.duration(400).delay(380)} style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.continueBtn, saving && styles.continueBtnDisabled]}
                        onPress={handleContinue}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.continueBtnText}>Finish</Text>
                    </TouchableOpacity>
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
    completeLabel: { fontSize: 14, color: '#9BB4D0', fontWeight: '500' },
    progressWrap: { paddingHorizontal: 24, marginBottom: 4 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 20 },

    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        lineHeight: 32,
    },
    subtitle: {
        fontSize: 14,
        color: '#9BB4D0',
        lineHeight: 21,
        marginBottom: 24,
    },

    // Cards
    modeCard: {
        backgroundColor: '#0F2236',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#1E3A5A',
    },
    modeCardActiveBlue: {
        borderColor: '#3D8EFF',
        backgroundColor: '#0D1F38',
    },
    modeCardPink: { borderColor: '#2A1A28' },
    modeCardActivePink: {
        borderColor: '#F06292',
        backgroundColor: '#1A0D18',
    },

    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#1A3A5C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBoxPink: { backgroundColor: '#3A1A2C' },
    iconText: { fontSize: 22 },

    recommendedBadge: {
        backgroundColor: '#3D8EFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    recommendedText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    verificationBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    verificationText: {
        color: '#9BB4D0',
        fontSize: 11,
        fontWeight: '500',
    },

    modeTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#3D8EFF',
        marginBottom: 4,
    },
    modeTitlePink: { color: '#F06292' },
    modeSubtitle: {
        fontSize: 13,
        color: '#9BB4D0',
        marginBottom: 14,
    },
    featureList: { marginBottom: 18 },

    selectBtn: {
        backgroundColor: '#3D8EFF',
        paddingVertical: 14,
        borderRadius: 50,
        alignItems: 'center',
    },
    selectBtnActive: {
        backgroundColor: '#3D8EFF',
        shadowColor: '#3D8EFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    selectBtnPink: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#F06292',
    },
    selectBtnActivePink: {
        backgroundColor: '#F06292',
        shadowColor: '#F06292',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    selectBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    selectBtnTextActive: { color: '#FFFFFF' },
    selectBtnTextPink: { color: '#F06292' },
    selectBtnTextActivePink: { color: '#FFFFFF' },

    // Bottom
    bottomBar: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 8 : 16,
        paddingTop: 12,
        backgroundColor: '#0D1B2E',
    },
    continueBtn: {
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
    },
    continueBtnDisabled: { opacity: 0.6 },
    continueBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
