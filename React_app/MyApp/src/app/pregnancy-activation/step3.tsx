import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import db from '../../database/db';

// ─── Status Timeline Component ────────────────────────────────────────────────
function StatusTimeline({ status }: { status: 'pending' | 'approved' | 'rejected' | 'none' }) {
    const isSubmitted = status !== 'none';
    const isReview = status === 'pending' || status === 'approved';
    const isApproved = status === 'approved';

    return (
        <View style={tl.container}>
            <View style={tl.row}>
                {/* Node 1: Submitted */}
                <View style={[tl.node, isSubmitted && tl.nodeActive]}>
                    <Text style={tl.nodeIcon}>{isSubmitted ? '✓' : ''}</Text>
                </View>
                <View style={[tl.line, isReview && tl.lineActive]} />

                {/* Node 2: Under Review */}
                <View style={[tl.node, isReview && tl.nodeActive]}>
                    {isApproved ? <Text style={tl.nodeIcon}>✓</Text> : <View style={tl.innerDot} />}
                </View>
                <View style={[tl.line, isApproved && tl.lineActive]} />

                {/* Node 3: Approved */}
                <View style={[tl.node, isApproved && tl.nodeActiveApproved]}>
                    <Text style={tl.nodeIcon}>{isApproved ? '★' : '⚙'}</Text>
                </View>
            </View>

            <View style={tl.labelRow}>
                <Text style={[tl.label, isSubmitted && tl.labelActive]}>Submitted</Text>
                <Text style={[tl.label, isReview && tl.labelActive, { textAlign: 'center' }]}>Under Review</Text>
                <Text style={[tl.label, isApproved && tl.labelActiveApproved, { textAlign: 'right' }]}>Approved</Text>
            </View>
        </View>
    );
}

const tl = StyleSheet.create({
    container: { paddingHorizontal: 10, marginVertical: 30 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    node: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#334155',
    },
    nodeActive: { backgroundColor: '#3D8EFF', borderColor: '#3D8EFF' },
    nodeActiveApproved: { backgroundColor: '#3D8EFF', borderColor: '#3D8EFF' },
    innerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
    nodeIcon: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    line: { flex: 1, height: 2, backgroundColor: '#1E293B', marginHorizontal: -2 },
    lineActive: { backgroundColor: '#3D8EFF' },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { flex: 1, color: '#64748B', fontSize: 13, fontWeight: '600' },
    labelActive: { color: '#F8FAFC' },
    labelActiveApproved: { color: '#3D8EFF', fontWeight: '800' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VerificationStatus() {
    const router = useRouter();
    const { phone, ocr_edd, ocr_confidence } = useLocalSearchParams<{ phone: string; ocr_edd: string; ocr_confidence: string }>();
    const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'none'>('none');
    const [loading, setLoading] = useState(true);
    const [ocrData, setOcrData] = useState<{ edd: string | null; lmp: string | null; confidence: string }>({ edd: null, lmp: null, confidence: 'low' });

    useEffect(() => {
        async function fetchStatus() {
            if (!phone) return;
            try {
                const row: any = await db.getFirstAsync(
                    'SELECT verification_status FROM patient_profiles WHERE phone = ?',
                    [phone]
                );
                if (row) setStatus(row.verification_status);

                // Load OCR results from pregnancy_documents
                const doc: any = await db.getFirstAsync(
                    'SELECT extracted_edd, extracted_lmp, ocr_confidence FROM pregnancy_documents WHERE phone = ? ORDER BY id DESC LIMIT 1',
                    [phone]
                );
                if (doc) {
                    setOcrData({
                        edd: doc.extracted_edd ?? null,
                        lmp: doc.extracted_lmp ?? null,
                        confidence: doc.ocr_confidence ?? 'low',
                    });
                }
            } catch (err) {
                console.error('Fetch status error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, [phone]);

    const handleAction = async () => {
        if (status === 'approved') {
            try {
                // Use OCR-extracted EDD if available (pre-filled by step2), else fallback
                const existingPreg: any = await db.getFirstAsync(
                    'SELECT edd, pregnancy_start_date FROM pregnancy_records WHERE phone = ?',
                    [phone ?? '']
                );

                const eddStr = existingPreg?.edd ?? (() => {
                    const d = new Date(); d.setDate(d.getDate() + 280); return d.toISOString().split('T')[0];
                })();
                const startDateStr = existingPreg?.pregnancy_start_date ?? new Date().toISOString().split('T')[0];

                // 1. Update patient profile care mode
                await db.runAsync(
                    "UPDATE patient_profiles SET care_mode = 'pregnancy', updated_at = ? WHERE phone = ?",
                    [new Date().toISOString(), phone ?? '']
                );

                // 2. Sync pregnancy record (OCR data may already be here from step2)
                await db.runAsync(
                    "INSERT OR REPLACE INTO pregnancy_records (phone, edd, pregnancy_start_date, created_at) VALUES (?, ?, ?, ?)",
                    [phone ?? '', eddStr, startDateStr, new Date().toISOString()]
                );

                // 3. Generate ANC visits
                const { generateANCVisits } = require('../../utils/pregnancy');
                await generateANCVisits(phone ?? '', startDateStr);

                router.replace({
                    pathname: '/dashboards/pregnancy' as any,
                    params: { phone: phone ?? '' }
                });
            } catch (e) {
                console.error('Activation error:', e);
            }
        } else {
            router.replace({
                pathname: '/dashboards/normal' as any,
                params: { phone: phone ?? '' }
            });
        }
    };

    const handleTempSubmit = async () => {
        try {
            // Use OCR-extracted dates if already in pregnancy_records
            const existingPreg: any = await db.getFirstAsync(
                'SELECT edd, pregnancy_start_date FROM pregnancy_records WHERE phone = ?',
                [phone ?? '']
            );

            const eddStr = existingPreg?.edd ?? (() => {
                const d = new Date(); d.setDate(d.getDate() + 280); return d.toISOString().split('T')[0];
            })();
            const startDateStr = existingPreg?.pregnancy_start_date ?? new Date().toISOString().split('T')[0];

            await db.runAsync(
                "UPDATE patient_profiles SET care_mode = 'pregnancy', verification_status = 'approved', pregnancy_verified = 1, updated_at = ? WHERE phone = ?",
                [new Date().toISOString(), phone ?? '']
            );

            await db.runAsync(
                "INSERT OR REPLACE INTO pregnancy_records (phone, edd, pregnancy_start_date, created_at) VALUES (?, ?, ?, ?)",
                [phone ?? '', eddStr, startDateStr, new Date().toISOString()]
            );

            const { generateANCVisits } = require('../../utils/pregnancy');
            await generateANCVisits(phone ?? '', startDateStr);

            router.replace({
                pathname: '/dashboards/pregnancy' as any,
                params: { phone: phone ?? '' }
            });
        } catch (e) {
            console.error('Temp submit error:', e);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#3D8EFF" />
            </View>
        );
    }

    const isApproved = status === 'approved';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                        <TouchableOpacity onPress={handleAction} style={styles.backBtn}>
                            <Text style={styles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Verification Status</Text>
                        <View style={{ width: 40 }} />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroCard}>
                        <View style={[styles.hourglassWrapper, isApproved && styles.heroApproved]}>
                            <Text style={styles.hourglassEmoji}>{isApproved ? '🎉' : '⌛'}</Text>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.statusSection}>
                        <View style={[styles.statusBadge, isApproved && styles.badgeApproved]}>
                            <Text style={[styles.statusDot, isApproved && { color: '#3D8EFF' }]}>●</Text>
                            <Text style={[styles.statusBadgeText, isApproved && { color: '#3D8EFF' }]}>
                                {status === 'approved' ? 'APPROVED' : status === 'rejected' ? 'REJECTED' : 'UNDER REVIEW'}
                            </Text>
                        </View>
                        <Text style={styles.statusTitle}>
                            {isApproved ? 'Welcome to Pregnancy Mode!' : 'Review in Progress'}
                        </Text>
                        <Text style={styles.statusSubtitle}>
                            {isApproved
                                ? 'Your documents have been verified. You can now access all pregnancy-specific features and tracking.'
                                : 'Your ASHA worker will verify your details within 48 hours. Please keep your phone reachable.'}
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.duration(500).delay(300)}>
                        <StatusTimeline status={status} />
                    </Animated.View>

                    <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.infoBox}>
                        <View style={styles.infoIconBox}>
                            <Text style={styles.infoIcon}>ℹ</Text>
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>{isApproved ? 'What next?' : 'Provisional Access'}</Text>
                            <Text style={styles.infoDesc}>
                                {isApproved
                                    ? 'Setup your pregnancy profile to start tracking your baby\'s growth and receive ANC reminders.'
                                    : 'You have 7-day provisional access to basic services while we review.'}
                            </Text>
                        </View>
                    </Animated.View>

                </ScrollView>

                <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.bottomBar}>
                    {/* Temporary Submit Button for Testing */}
                    <TouchableOpacity
                        style={[styles.viewBtn, { backgroundColor: '#3D8EFF', marginBottom: 12, borderColor: '#3D8EFF' }]}
                        onPress={handleTempSubmit}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.viewBtnText}>Submit (Test Approval)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.viewBtn, isApproved && styles.btnApproved]}
                        onPress={handleAction}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.viewBtnText, isApproved && { color: '#FFFFFF' }]}>
                            {isApproved ? 'Go to Pregnancy Dashboard' : 'View Submitted Details'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1522' },
    safeArea: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backArrow: { color: '#FFFFFF', fontSize: 24, fontWeight: '600' },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    heroCard: {
        backgroundColor: '#162032',
        borderRadius: 32,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    hourglassWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroApproved: { backgroundColor: '#0F2D3D' },
    hourglassEmoji: { fontSize: 60, color: '#3D8EFF' },
    statusSection: { alignItems: 'center', marginBottom: 10 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#332308',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 50,
        marginBottom: 20,
    },
    badgeApproved: { backgroundColor: '#0F2D3D' },
    statusDot: { color: '#EAB308', fontSize: 10, marginRight: 8 },
    statusBadgeText: { color: '#EAB308', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
    statusTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
    statusSubtitle: { color: '#94A3B8', fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#162032',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1E293B',
        alignItems: 'center',
        gap: 20,
    },
    infoIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoIcon: { color: '#3D8EFF', fontSize: 22, fontWeight: '800' },
    infoTextContainer: { flex: 1 },
    infoTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginBottom: 4 },
    infoDesc: { color: '#94A3B8', fontSize: 14, lineHeight: 20 },
    bottomBar: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#0D1522',
        position: 'absolute',
        bottom: 0,
        width: '100%',
    },
    viewBtn: {
        backgroundColor: '#1E293B',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    btnApproved: { backgroundColor: '#3D8EFF', borderColor: '#3D8EFF' },
    viewBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
