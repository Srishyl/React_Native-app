import React, { useState } from 'react';
import { Text } from '@/components/AppText';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Platform,
    Alert,
} from 'react-native';
import { Text } from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import db from '../../database/db';

// ─── Progress Ring Component ──────────────────────────────────────────────────
function ProgressRing({ current, total }: { current: number; total: number }) {
    const percentage = Math.min((current / total) * 100, 100);

    return (
        <View style={ring.container}>
            <View style={ring.baseCircle} />
            {/* 
                We use multiple borders at different rotations to simulate the arc.
                For a perfect ring in RN without SVG, we'd need a more complex solution, 
                but we'll stick to a high-quality simulation using the borders.
            */}
            <View style={[
                ring.activeArc,
                {
                    borderColor: '#F06292',
                    borderRightColor: percentage > 25 ? '#F06292' : 'transparent',
                    borderBottomColor: percentage > 50 ? '#F06292' : 'transparent',
                    borderLeftColor: percentage > 75 ? '#F06292' : 'transparent',
                }
            ]}>
                <View style={ring.innerCircle}>
                    <Text style={ring.numberText}>{current}</Text>
                    <Text style={ring.label}>WEEKS</Text>
                </View>
            </View>
        </View>
    );
}

const ring = StyleSheet.create({
    container: { width: 220, height: 220, alignSelf: 'center', marginVertical: 30, justifyContent: 'center', alignItems: 'center' },
    baseCircle: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 110,
        borderWidth: 16,
        borderColor: '#111A2C',
    },
    activeArc: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 110,
        borderWidth: 16,
        borderColor: 'transparent',
        borderTopColor: '#F06292',
        transform: [{ rotate: '-45deg' }],
    },
    innerCircle: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '45deg' }],
    },
    numberText: { color: '#F06292', fontSize: 60, fontWeight: '800', marginBottom: -4 },
    label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PregnancyDashboard() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [patientName, setPatientName] = useState('Mama');
    const [stats, setStats] = useState({ week: 1, daysLeft: 280, fruit: 'raspberry 🫐' });
    const [nextVisit, setNextVisit] = useState<any>(null);

    useFocusEffect(
        React.useCallback(() => {
            async function loadData() {
                if (!phone) return;
                try {
                    // Fetch patient name
                    const user: any = await db.getFirstAsync(
                        'SELECT full_name FROM patient_profiles WHERE phone = ?',
                        [phone]
                    );
                    if (user && user.full_name) setPatientName(user.full_name.split(' ')[0]);

                    // Fetch pregnancy record
                    const preg: any = await db.getFirstAsync(
                        'SELECT edd, pregnancy_start_date FROM pregnancy_records WHERE phone = ?',
                        [phone]
                    );

                    if (preg && preg.edd) {
                        const { calculatePregnancyStats } = require('../../utils/pregnancy');
                        const pStats = calculatePregnancyStats(preg.edd);
                        setStats({
                            week: pStats.currentWeek,
                            daysLeft: pStats.daysRemaining,
                            fruit: pStats.babySize
                        });
                    }

                    // Fetch next ANC visit
                    const visit: any = await db.getFirstAsync(
                        "SELECT scheduled_date FROM anc_visits WHERE phone = ? AND status = 'upcoming' ORDER BY scheduled_date ASC",
                        [phone]
                    );
                    if (visit) {
                        const d = new Date(visit.scheduled_date);
                        const formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                        setNextVisit({ date: formattedDate });
                    }

                } catch (err) {
                    console.error('Failed to load pregnancy data:', err);
                }
            }
            loadData();
        }, [phone])
    );

    const navigateToProfile = () => {
        router.push({
            pathname: '/profile-setup/step1' as any,
            params: { phone: phone ?? '' }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B1320" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logoBox}>
                            <Text style={styles.logoIcon}>🍃</Text>
                        </View>
                        <View>
                            <Text style={styles.greetingText}>Hi {patientName},</Text>
                            <Text style={styles.headerTitle}>Week {stats.week} of Pregnancy 🌸</Text>
                            <Text style={styles.headerSubtitle}>Your baby is the size of a {stats.fruit}</Text>
                            <TouchableOpacity
                                style={{ backgroundColor: '#2D1F2D', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8 }}
                                onPress={async () => {
                                    if (phone) {
                                        await db.runAsync("UPDATE patient_profiles SET care_mode = 'normal' WHERE phone = ?", [phone]);
                                        router.replace({ pathname: '/dashboards/normal' as any, params: { phone } });
                                    }
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={{ color: '#3D8EFF', fontSize: 11, fontWeight: '700' }}>💼 Switch Home</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.profileBtn}
                        onPress={() => {
                            Alert.alert('Logout', 'Are you sure you want to logout?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Logout', style: 'destructive', onPress: () => router.replace('/' as any) }
                            ]);
                        }}
                    >
                        <Text style={styles.profileIcon}>🚪</Text>
                    </TouchableOpacity>
                </Animated.View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Progress Card ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statsCard}>
                        <ProgressRing current={stats.week} total={40} />
                        <View style={styles.rangeRow}>
                            <Text style={styles.rangeText}>0 Weeks</Text>
                            <Text style={styles.rangeText}>40 Weeks</Text>
                        </View>
                        <View style={styles.dueCountdown}>
                            <Text style={styles.dueLabel}>Days until due date</Text>
                            <Text style={styles.dueValue}>{stats.daysLeft} days</Text>
                        </View>
                    </Animated.View>

                    {/* ── Quick Actions ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
                        <View style={styles.actionGrid}>
                            <TouchableOpacity
                                style={styles.actionItem}
                                onPress={() => router.push({
                                    pathname: '/dashboards/anc-visits' as any,
                                    params: { phone: phone ?? '' }
                                })}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#1E293B' }]}>
                                    <Text style={styles.emojiIcon}>📅</Text>
                                </View>
                                <Text style={styles.actionLabel}>ANC Schedule</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionItem}
                                onPress={() => router.push({
                                    pathname: '/dashboards/danger-signs' as any,
                                    params: { phone: phone ?? '' }
                                })}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#3A202A' }]}>
                                    <Text style={styles.emojiIcon}>⚠️</Text>
                                </View>
                                <Text style={styles.actionLabel}>Danger Signs</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionItem}
                                onPress={() => router.push({
                                    pathname: '/dashboards/nutrition' as any,
                                    params: { phone: phone ?? '' }
                                })}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#18332F' }]}>
                                    <Text style={styles.emojiIcon}>🍏</Text>
                                </View>
                                <Text style={styles.actionLabel}>Nutrition</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionItem}
                                onPress={() => router.push({
                                    pathname: '/dashboards/baby-growth' as any,
                                    params: { phone: phone ?? '' }
                                })}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#2D1B36' }]}>
                                    <Text style={styles.emojiIcon}>👶</Text>
                                </View>
                                <Text style={styles.actionLabel}>Baby Growth</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* ── Next ANC Visit ── */}
                    {nextVisit && (
                        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
                            <Text style={styles.sectionTitle}>NEXT ANC VISIT</Text>
                            <View style={styles.ancBox}>
                                <View style={styles.ancHeaderRow}>
                                    <View>
                                        <Text style={styles.ancDate}>{nextVisit.date}</Text>
                                        <Text style={styles.ancLocation}>📍 PHC Whitefield</Text>
                                    </View>
                                    <View style={styles.ancStetho}>
                                        <Text style={styles.stethoIcon}>🩺</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.reminderBtn}>
                                    <Text style={styles.reminderBtnText}>🔔 Add Reminder</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {/* ── Today's Checklist ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(400)}>
                        <Text style={styles.sectionTitle}>TODAY'S CHECKLIST</Text>
                        <View style={styles.checklist}>
                            <CheckItem label="Iron tablet" emoji="💊" checked={true} />
                            <CheckDivider />
                            <CheckItem label="Folic Acid" emoji="🧃" checked={true} />
                            <CheckDivider />
                            <CheckItem label="10 kicks logged" emoji="👣" checked={true} />
                        </View>
                    </Animated.View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* ── Bottom Nav ── */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} activeOpacity={1}>
                        <Text style={styles.navIconActive}>⌂</Text>
                        <Text style={styles.navTextActive}>HOME</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>📈</Text>
                        <Text style={styles.navText}>TRACKER</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>🔔</Text>
                        <Text style={styles.navText}>ALERTS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>🎧</Text>
                        <Text style={styles.navText}>SUPPORT</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}

// ─── Helper Components ────────────────────────────────────────────────────────
function CheckItem({ label, emoji, checked }: { label: string; emoji: string; checked: boolean }) {
    return (
        <View style={styles.checkRow}>
            <View style={styles.checkIconBox}>
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </View>
            <Text style={styles.checkLabel}>{label}</Text>
            <View style={[styles.circleCheck, checked && styles.circleCheckActive]}>
                <Text style={styles.circleCheckText}>✓</Text>
            </View>
        </View>
    );
}

function CheckDivider() {
    return <View style={styles.divider} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B1320' },
    safeArea: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 24,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    logoBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2F1A2F', justifyContent: 'center', alignItems: 'center' },
    logoIcon: { fontSize: 22 },
    headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
    headerSubtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155'
    },
    profileIcon: { fontSize: 20, color: '#FFFFFF' },

    // Stats Card
    statsCard: {
        backgroundColor: '#131D2D',
        borderRadius: 32,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    rangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -20, marginBottom: 20 },
    rangeText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    dueCountdown: { alignItems: 'center' },
    dueLabel: { color: '#94A3B8', fontSize: 15, fontWeight: '500', marginBottom: 6 },
    dueValue: { color: '#F06292', fontSize: 32, fontWeight: '900' },
    greetingText: { color: '#F06292', fontSize: 13, fontWeight: '700', marginBottom: 2 },

    sectionTitle: { color: '#64748B', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },

    // Actions
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', marginBottom: 32 },
    actionItem: {
        width: '47%',
        backgroundColor: '#131D2D',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emojiIcon: { fontSize: 22 },
    actionLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

    // ANC Box
    ancBox: { backgroundColor: '#131D2D', borderRadius: 24, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: '#1E293B' },
    ancHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    ancDate: { color: '#F06292', fontSize: 20, fontWeight: '800', marginBottom: 4 },
    ancLocation: { color: '#94A3B8', fontSize: 15 },
    ancStetho: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2F1A2F', justifyContent: 'center', alignItems: 'center' },
    stethoIcon: { fontSize: 22 },
    reminderBtn: { backgroundColor: '#F06292', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    reminderBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

    // Checklist
    checklist: { backgroundColor: '#131D2D', borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#1E293B' },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    checkIconBox: { width: 32, alignItems: 'center' },
    checkLabel: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    circleCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2D1F2D', justifyContent: 'center', alignItems: 'center' },
    circleCheckActive: { backgroundColor: '#2D1F2D' },
    circleCheckText: { color: '#F06292', fontSize: 14, fontWeight: '900' },
    divider: { height: 1, backgroundColor: '#1E293B', marginVertical: 18 },

    // Bottom Nav
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        backgroundColor: '#0D1522',
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
        position: 'absolute',
        bottom: 0,
        width: '100%',
    },
    navItem: { alignItems: 'center', gap: 4 },
    navIconActive: { color: '#F06292', fontSize: 26 },
    navTextActive: { color: '#F06292', fontSize: 10, fontWeight: '800' },
    navIcon: { color: '#64748B', fontSize: 22 },
    navText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
});
