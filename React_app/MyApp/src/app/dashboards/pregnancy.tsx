import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import db from '../../database/db';

// ─── SVG Rings (Simulated with absolute views) ─────────────────────────────────
function ProgressRing({ current, total }: { current: number; total: number }) {
    // A simple simulated ring using borders for the design
    return (
        <View style={ring.container}>
            <View style={ring.baseCircle} />
            {/* Note: React Native styling doesn't easily do partial circular borders without SVG.
          We use a solid base + an overlay to simulate the thick pink arc style. */}
            <View style={ring.activeArc}>
                <View style={ring.innerCircle}>
                    <Text style={ring.numberText}>{current}</Text>
                    <Text style={ring.label}>WEEKS</Text>
                </View>
            </View>
        </View>
    );
}

const ring = StyleSheet.create({
    container: { width: 180, height: 180, alignSelf: 'center', marginVertical: 20 },
    baseCircle: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 90,
        borderWidth: 12,
        borderColor: '#1E293B',
    },
    activeArc: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 90,
        // Simulating the 24/40 weeks pink arc
        borderTopWidth: 12,
        borderRightWidth: 12,
        borderBottomWidth: 12,
        borderLeftWidth: 12,
        borderColor: '#F06292',
        borderLeftColor: 'transparent',
        borderBottomColor: 'transparent',
        transform: [{ rotate: '-45deg' }],
    },
    innerCircle: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '45deg' }], // reverse rotation for text
    },
    numberText: { color: '#F06292', fontSize: 44, fontWeight: '800', marginBottom: -4 },
    label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PregnancyDashboard() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [patientName, setPatientName] = React.useState('Mama');

    React.useEffect(() => {
        async function loadUser() {
            if (!phone) return;
            try {
                const row: any = await db.getFirstAsync(
                    'SELECT full_name FROM patient_profiles WHERE phone = ?',
                    [phone]
                );
                if (row && row.full_name) {
                    setPatientName(row.full_name.split(' ')[0]);
                }
            } catch (err) {
                console.error('Failed to load user info:', err);
            }
        }
        loadUser();
    }, [phone]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1522" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.appIcon}>
                            <Text style={styles.appIconText}>🍃</Text>
                        </View>
                        <View>
                            <Text style={styles.greetingText}>Hi {patientName},</Text>
                            <Text style={styles.headerTitle}>Week 24 of Pregnancy 🌸</Text>
                            <Text style={styles.headerSub}>Your baby is the size of a corn 🌽</Text>
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
                    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.progressCard}>
                        <ProgressRing current={24} total={40} />
                        <View style={styles.weekRow}>
                            <Text style={styles.weekText}>0 Weeks</Text>
                            <Text style={styles.weekText}>40 Weeks</Text>
                        </View>
                        <View style={styles.daysWrapper}>
                            <Text style={styles.daysLabel}>Days until due date</Text>
                            <Text style={styles.daysValue}>112 days</Text>
                        </View>
                    </Animated.View>

                    {/* ── Quick Actions Grid ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(200)}>
                        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
                        <View style={styles.grid}>
                            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
                                <View style={[styles.iconBox, { backgroundColor: '#1E293B' }]}>
                                    <Image source={require('../../../assets/icon_anc.png')} style={styles.actionImg} />
                                </View>
                                <Text style={styles.actionText}>ANC Schedule</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
                                <View style={[styles.iconBox, { backgroundColor: '#3A202A' }]}>
                                    <Image source={require('../../../assets/icon_danger.png')} style={styles.actionImg} />
                                </View>
                                <Text style={styles.actionText}>Danger Signs</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
                                <View style={[styles.iconBox, { backgroundColor: '#18332F' }]}>
                                    <Image source={require('../../../assets/icon_nutrition.png')} style={styles.actionImg} />
                                </View>
                                <Text style={styles.actionText}>Nutrition</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
                                <View style={[styles.iconBox, { backgroundColor: '#2D1B36' }]}>
                                    <Image source={require('../../../assets/icon_baby.png')} style={styles.actionImg} />
                                </View>
                                <Text style={styles.actionText}>Baby Growth</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* ── Next ANC Visit ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(300)}>
                        <Text style={styles.sectionTitle}>NEXT ANC VISIT</Text>
                        <View style={styles.ancCard}>
                            <View style={styles.ancHeader}>
                                <View>
                                    <Text style={styles.ancDate}>March 10, 2026</Text>
                                    <Text style={styles.ancLocation}>📍 PHC Whitefield</Text>
                                </View>
                                <View style={styles.ancIconBox}>
                                    <Text style={styles.ancIcon}>🩺</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.addReminderBtn} activeOpacity={0.85}>
                                <Text style={styles.addReminderText}>🔔  Add Reminder</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* ── Today's Checklist ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(400)}>
                        <Text style={styles.sectionTitle}>TODAY'S CHECKLIST</Text>
                        <View style={styles.checklistCard}>
                            <View style={styles.checkItem}>
                                <View style={styles.checkIconWrapper}><Text style={styles.checkEmoji}>💊</Text></View>
                                <Text style={styles.checkText}>Iron tablet</Text>
                                <View style={styles.circleCheck}><Text style={styles.circleTick}>✓</Text></View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.checkItem}>
                                <View style={styles.checkIconWrapper}><Text style={styles.checkEmoji}>🧃</Text></View>
                                <Text style={styles.checkText}>Folic Acid</Text>
                                <View style={styles.circleCheck}><Text style={styles.circleTick}>✓</Text></View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.checkItem}>
                                <View style={styles.checkIconWrapper}><Text style={styles.checkEmoji}>👣</Text></View>
                                <Text style={styles.checkText}>10 kicks logged</Text>
                                <View style={styles.circleCheck}><Text style={styles.circleTick}>✓</Text></View>
                            </View>
                        </View>
                    </Animated.View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── Bottom Nav ── */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} activeOpacity={1}>
                        <Text style={styles.navIconActive}>⌂</Text>
                        <Text style={styles.navTextActive}>HOME</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
                        <Text style={styles.navIcon}>📈</Text>
                        <Text style={styles.navText}>TRACKER</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
                        <Text style={styles.navIcon}>🔔</Text>
                        <Text style={styles.navText}>ALERTS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
                        <Text style={styles.navIcon}>🎧</Text>
                        <Text style={styles.navText}>SUPPORT</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1522' },
    safeArea: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    appIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#2D1F2D', justifyContent: 'center', alignItems: 'center' },
    appIconText: { fontSize: 20 },
    greetingText: { color: '#F06292', fontSize: 13, fontWeight: '700', marginBottom: 2 },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    headerSub: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
    profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
    profileIcon: { fontSize: 18 },

    // Progress Card
    progressCard: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
    },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -10, marginBottom: 20 },
    weekText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
    daysWrapper: { alignItems: 'center' },
    daysLabel: { color: '#64748B', fontSize: 14, fontWeight: '500', marginBottom: 4 },
    daysValue: { color: '#F06292', fontSize: 24, fontWeight: '800' },

    // Sections
    sectionTitle: { color: '#94A3B8', fontSize: 13, fontWeight: '800', letterSpacing: 1.2, marginBottom: 16 },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 32 },
    actionCard: {
        width: '47%',
        backgroundColor: '#162032',
        borderRadius: 20,
        padding: 20,
    },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    actionImg: { width: 22, height: 22 },
    actionText: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },

    // ANC Result Card
    ancCard: { backgroundColor: '#162032', borderRadius: 20, padding: 20, marginBottom: 32 },
    ancHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    ancDate: { color: '#F06292', fontSize: 18, fontWeight: '800', marginBottom: 6 },
    ancLocation: { color: '#94A3B8', fontSize: 14 },
    ancIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2D1F2D', justifyContent: 'center', alignItems: 'center' },
    ancIcon: { fontSize: 20 },
    addReminderBtn: { backgroundColor: '#F06292', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    addReminderText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

    // Checklist
    checklistCard: { backgroundColor: '#162032', borderRadius: 20, padding: 20, marginBottom: 24 },
    checkItem: { flexDirection: 'row', alignItems: 'center' },
    checkIconWrapper: { width: 32, justifyContent: 'center' },
    checkEmoji: { fontSize: 18 },
    checkText: { flex: 1, color: '#F8FAFC', fontSize: 15, fontWeight: '600', marginLeft: 8 },
    circleCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#3A202A', justifyContent: 'center', alignItems: 'center' },
    circleTick: { color: '#F06292', fontSize: 12, fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#1E293B', marginVertical: 16 },

    // Bottom Nav
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        backgroundColor: '#111A2C',
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
    },
    navItem: { alignItems: 'center', gap: 4 },
    navIconActive: { color: '#F06292', fontSize: 24 },
    navTextActive: { color: '#F06292', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    navIcon: { color: '#64748B', fontSize: 22 },
    navText: { color: '#64748B', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
