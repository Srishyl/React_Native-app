import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import db from '../../database/db';

// ─── Progress Dots ────────────────────────────────────────────────────────────
function ProgressDots({ current }: { current: number }) {
    return (
        <View style={dots.container}>
            {[1, 2, 3].map((i) => (
                <View
                    key={i}
                    style={[
                        dots.dot,
                        i === current ? dots.active : dots.inactive,
                        i === current && { width: 24 }
                    ]}
                />
            ))}
        </View>
    );
}
const dots = StyleSheet.create({
    container: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 30 },
    dot: { height: 6, borderRadius: 3 },
    inactive: { width: 6, backgroundColor: '#1E293B' },
    active: { backgroundColor: '#F06292' },
});

// ─── Option Card Component ──────────────────────────────────────────────────────
function OptionCard({
    title,
    subtitle,
    icon,
    iconBg,
    onPress
}: {
    title: string;
    subtitle: string;
    icon: string;
    iconBg: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.optionCard} activeOpacity={0.8} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Text style={styles.iconEmoji}>{icon}</Text>
            </View>
            <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{title}</Text>
                <Text style={styles.optionSubtitle}>{subtitle}</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ActivationStep1() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [isDocsExpanded, setIsDocsExpanded] = React.useState(false);
    const [isApproved, setIsApproved] = React.useState(false);

    const handleAshaOption = async () => {
        setIsApproved(true);
        try {
            const now = new Date().toISOString();
            const todayStr = new Date().toISOString().split('T')[0];
            const edd = new Date();
            edd.setDate(edd.getDate() + 280);
            const eddStr = edd.toISOString().split('T')[0];

            // 1. Update patient profile to approved and set pregnancy mode
            await db.runAsync(
                `UPDATE patient_profiles 
                 SET verification_status = 'approved',
                     pregnancy_verified = 1,
                     care_mode = 'pregnancy',
                     verification_method = 'asha',
                     updated_at = ?
                 WHERE phone = ?`,
                [now, phone ?? '']
            );

            // 2. Initialize pregnancy record
            await db.runAsync(
                `INSERT OR REPLACE INTO pregnancy_records (phone, edd, pregnancy_start_date, created_at)
                 VALUES (?, ?, ?, ?)`,
                [phone ?? '', eddStr, todayStr, now]
            );

            // 3. Generate ANC visits
            const { generateANCVisits } = require('../../utils/pregnancy');
            await generateANCVisits(phone ?? '', todayStr);

            // 4. Redirect after a short delay to show "Approved" state
            setTimeout(() => {
                router.replace({
                    pathname: '/dashboards/pregnancy' as any,
                    params: { phone: phone ?? '' }
                });
            }, 1500);

        } catch (err) {
            console.error('ASHA option error:', err);
            setIsApproved(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Header ── */}
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Text style={styles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Activate Pregnancy Mode</Text>
                        <View style={{ width: 40 }} />
                    </Animated.View>

                    {/* ── Progress ── */}
                    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
                        <ProgressDots current={1} />
                    </Animated.View>

                    {/* ── Title Section ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.titleSection}>
                        <Text style={styles.mainTitle}>Verify your pregnancy</Text>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                We need to verify your pregnancy to provide safe, accurate guidance and connect you with the right healthcare resources.
                            </Text>
                        </View>
                    </Animated.View>

                    {/* ── Options ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.optionsContainer}>
                        <OptionCard
                            title="Option A: Upload Document"
                            subtitle="USG report, ANC card, or Doctor's certificate"
                            icon="📄"
                            iconBg="#2D1F2D"
                            onPress={() => router.push({
                                pathname: '/pregnancy-activation/step2' as any,
                                params: { phone: phone ?? '', method: 'document' }
                            })}
                        />

                        <OptionCard
                            title={isApproved ? "Option B: Approved!" : "Option B: ASHA Verified"}
                            subtitle={isApproved ? "Redirecting to your dashboard..." : "Ask your local ASHA worker to verify your pregnancy in-person"}
                            icon={isApproved ? "✅" : "💼"}
                            iconBg={isApproved ? "#0F2D3D" : "#1A3A5C"}
                            onPress={isApproved ? () => { } : handleAshaOption}
                        />
                    </Animated.View>

                    {/* ── Collapsible FAQ ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.faqSection}>
                        <TouchableOpacity
                            style={styles.faqHeader}
                            activeOpacity={0.7}
                            onPress={() => setIsDocsExpanded(!isDocsExpanded)}
                        >
                            <Text style={styles.faqTitle}>Which documents are accepted?</Text>
                            <Text style={[styles.faqArrow, isDocsExpanded && { transform: [{ rotate: '90deg' }] }]}>›</Text>
                        </TouchableOpacity>

                        {isDocsExpanded && (
                            <View style={styles.faqContent}>
                                <Text style={styles.faqBody}>
                                    We accept official medical records including Ultrasound (USG) reports from the last 3 months, Antenatal Care (ANC) cards issued by government clinics, or a signed certificate from a registered medical practitioner.
                                </Text>
                            </View>
                        )}
                    </Animated.View>

                </ScrollView>

                {/* ── Bottom Nav Simulation ── */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>⌂</Text>
                        <Text style={styles.navText}>HOME</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={[styles.navIcon, styles.navIconActive]}>♥</Text>
                        <Text style={[styles.navText, styles.navTextActive]}>HEALTH</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>👥</Text>
                        <Text style={styles.navText}>COMMUNITY</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => router.push({
                            pathname: '/profile-setup/step1' as any,
                            params: { phone: phone ?? '' }
                        })}
                    >
                        <Text style={styles.navIcon}>👤</Text>
                        <Text style={styles.navText}>PROFILE</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1522' },
    safeArea: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backArrow: { color: '#FFFFFF', fontSize: 24, fontWeight: '600' },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

    titleSection: { marginBottom: 30 },
    mainTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginBottom: 20 },
    infoBox: {
        backgroundColor: '#162032',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    infoText: { color: '#94A3B8', fontSize: 15, lineHeight: 22 },

    optionsContainer: { gap: 16, marginBottom: 30 },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#162032',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#1E293B',
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconEmoji: { fontSize: 24 },
    optionTextContainer: { flex: 1 },
    optionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
    optionSubtitle: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },
    arrowIcon: { color: '#3D8EFF', fontSize: 24, fontWeight: '600' },

    faqSection: {
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
        paddingTop: 20,
    },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    faqArrow: { color: '#94A3B8', fontSize: 24 },
    faqContent: { marginTop: 12 },
    faqBody: { color: '#94A3B8', fontSize: 14, lineHeight: 20, opacity: 0.8 },

    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        backgroundColor: '#111A2C',
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
        position: 'absolute',
        bottom: 0,
        width: '100%',
    },
    navItem: { alignItems: 'center', gap: 4 },
    navIcon: { color: '#64748B', fontSize: 22 },
    navIconActive: { color: '#F06292' },
    navText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
    navTextActive: { color: '#F06292' },
});
