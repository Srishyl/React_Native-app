import React from 'react';
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
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import db from '../../database/db';

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NormalDashboard() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [patientName, setPatientName] = React.useState('Patient');
    const [appointments, setAppointments] = React.useState<any[]>([]);
    const [completedAppointments, setCompletedAppointments] = React.useState<any[]>([]);

    useFocusEffect(
        React.useCallback(() => {
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

                    // Also fetch any pending AND completed appointments
                    try {
                        const apps: any = await db.getAllAsync(
                            "SELECT * FROM appointments WHERE patient_phone = ? AND status = 'pending' ORDER BY id DESC",
                            [phone]
                        );
                        setAppointments(apps || []);

                        const completedApps: any = await db.getAllAsync(
                            "SELECT * FROM appointments WHERE patient_phone = ? AND status = 'done' ORDER BY id DESC LIMIT 5",
                            [phone]
                        );
                        setCompletedAppointments(completedApps || []);
                    } catch (e) {
                        setAppointments([]);
                        setCompletedAppointments([]);
                    }

                } catch (err) {
                    console.error('Failed to load user info:', err);
                }
            }
            loadUser();
        }, [phone])
    );

    const handleMarkDone = async (appId: number) => {
        try {
            await db.runAsync('UPDATE appointments SET status = ? WHERE id = ?', ['done', appId]);
            // Move item from appointments to completedAppointments
            const finishedApp = appointments.find(a => a.id === appId);
            if (finishedApp) {
                setAppointments(prev => prev.filter(app => app.id !== appId));
                setCompletedAppointments(prev => [{ ...finishedApp, status: 'done' }, ...prev]);
            }
        } catch (error) {
            console.error('Failed to mark done:', error);
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
                    {/* ── Top Header Bar ── */}
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.topBar}>
                        <TouchableOpacity style={styles.menuBtn}>
                            <Text style={styles.menuIcon}>≡</Text>
                        </TouchableOpacity>
                        <Text style={styles.phcId}>PHC-KA-2024-483921</Text>
                        <TouchableOpacity
                            style={styles.qrBtn}
                            onPress={() => {
                                Alert.alert('Logout', 'Are you sure you want to logout?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Logout', style: 'destructive', onPress: () => router.replace('/' as any) }
                                ]);
                            }}
                        >
                            <Text style={styles.qrIcon}>🚪</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* ── Greeting ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.greetingSection}>
                        <Text style={styles.greetingText}>Good morning,{'\n'}{patientName} 👋</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <Text style={[styles.greetingSub, { marginTop: 0 }]}>How are you feeling today?</Text>
                            <TouchableOpacity
                                style={{ backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#334155' }}
                                onPress={() => router.push({
                                    pathname: '/pregnancy-activation/step1' as any,
                                    params: { phone: phone ?? '' }
                                })}
                                activeOpacity={0.8}
                            >
                                <Text style={{ color: '#F06292', fontSize: 12, fontWeight: '700' }}>🤰 Pregnancy Mode ›</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* ── Quick Actions Grid ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.grid}>
                        {/* Action Card 1: Check Symptoms */}
                        <TouchableOpacity
                            style={styles.actionCard}
                            activeOpacity={0.8}
                            onPress={() => router.push('/symptom-triage' as any)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: '#E8F1FE' }]}>
                                <Image
                                    source={require('../../../assets/icon_check_symptoms.png')}
                                    style={styles.actionImg}
                                    contentFit="contain"
                                />
                            </View>
                            <Text style={styles.actionText}>Check{'\n'}Symptoms</Text>
                        </TouchableOpacity>

                        {/* Action Card 2: Find PHC */}
                        < TouchableOpacity
                            style={styles.actionCard}
                            activeOpacity={0.8}
                            onPress={() => router.push('/find-phc' as any)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: '#E8F1FE' }]}>
                                <Image
                                    source={require('../../../assets/icon_find_phc.png')}
                                    style={styles.actionImg}
                                    contentFit="contain"
                                />
                            </View>
                            <Text style={styles.actionText}>Find PHC</Text>
                        </TouchableOpacity >

                        {/* Action Card 3: My Records */}
                        < TouchableOpacity style={styles.actionCard} activeOpacity={0.8} >
                            <View style={[styles.iconBox, { backgroundColor: '#E8F1FE' }]}>
                                <Image
                                    source={require('../../../assets/icon_my_records.png')}
                                    style={styles.actionImg}
                                    contentFit="contain"
                                />
                            </View>
                            <Text style={styles.actionText}>My Records</Text>
                        </TouchableOpacity >

                        {/* Action Card 4: Medicines */}
                        < TouchableOpacity
                            style={styles.actionCard}
                            activeOpacity={0.8}
                            onPress={() => router.push('/drug-recommendation' as any)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: '#E8F1FE' }]}>
                                <Image
                                    source={require('../../../assets/icon_medicines.png')}
                                    style={styles.actionImg}
                                    contentFit="contain"
                                />
                            </View>
                            <Text style={styles.actionText}>Medicines</Text>
                        </TouchableOpacity >
                    </Animated.View >

                    {/* ── Nearest PHC ── */}
                    < Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.section} >
                        <Text style={styles.sectionTitle}>Nearest PHC</Text>
                        <View style={styles.phcCard}>
                            <View style={styles.phcHeaderRow}>
                                <Text style={styles.phcName}>Locate Facilities</Text>
                                <View style={styles.openBadge}>
                                    <Text style={styles.openText}>LIVE</Text>
                                </View>
                            </View>

                            <Text style={[styles.phcDistance, { marginTop: 4, marginBottom: 16 }]}>
                                Use your GPS to find the nearest primary health centers and clinics.
                            </Text>

                            <TouchableOpacity
                                style={styles.bookTokenBtn}
                                activeOpacity={0.85}
                                onPress={() => router.push('/find-phc' as any)}
                            >
                                <Text style={styles.bookTokenText}>📍 Start Search</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View >

                    {/* ── Your Tokens ── */}
                    < Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.section} >
                        <Text style={styles.sectionTitle}>Your Tokens</Text>
                        <View style={styles.remindersCard}>
                            {appointments.length === 0 ? (
                                <View style={{ padding: 10, alignItems: 'center' }}>
                                    <Text style={{ color: '#9BB4D0', fontSize: 14 }}>No upcoming appointments booked.</Text>
                                </View>
                            ) : (
                                appointments.map((app, index) => (
                                    <React.Fragment key={app.id}>
                                        <View style={styles.reminderRow}>
                                            <View style={styles.reminderIconUrgent}>
                                                <Text style={styles.reminderAlert}>📅</Text>
                                            </View>
                                            <View style={styles.reminderInfo}>
                                                <Text style={styles.reminderTitle}>{app.doctor_name}</Text>
                                                <Text style={styles.reminderTime}>{app.specialty} at {app.time}</Text>
                                                <Text style={{ fontSize: 11, color: '#3D8EFF', marginTop: 4, fontWeight: '600' }}>
                                                    Token: {app.token_id || 'N/A'} • Pat ID: {app.patient_id || 'N/A'} • Doc: {app.doctor_id || 'N/A'}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.startBtn}
                                                activeOpacity={0.8}
                                                onPress={() => handleMarkDone(app.id)}
                                            >
                                                <Text style={styles.startBtnText}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {index < appointments.length - 1 && <View style={styles.divider} />}
                                    </React.Fragment>
                                ))
                            )}
                        </View>
                    </Animated.View >

                    {/* ── Completed Tokens ── */}
                    {
                        completedAppointments.length > 0 && (
                            <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.section}>
                                <Text style={styles.sectionTitle}>Completed Tokens</Text>
                                <View style={styles.remindersCard}>
                                    {completedAppointments.map((app, index) => (
                                        <React.Fragment key={app.id}>
                                            <View style={[styles.reminderRow, { opacity: 0.7 }]}>
                                                <View style={styles.reminderIconDone}>
                                                    <Text style={styles.reminderCheck}>✓</Text>
                                                </View>
                                                <View style={styles.reminderInfo}>
                                                    <Text style={[styles.reminderTitle, { textDecorationLine: 'line-through', color: '#6B8BAE' }]}>{app.doctor_name}</Text>
                                                    <Text style={styles.reminderTime}>{app.specialty} at {app.time}</Text>
                                                    <Text style={{ fontSize: 11, color: '#6B8BAE', marginTop: 4, fontWeight: '600' }}>
                                                        Token: {app.token_id || 'N/A'} • Pat ID: {app.patient_id || 'N/A'} • Doc: {app.doctor_id || 'N/A'}
                                                    </Text>
                                                </View>
                                                <Text style={styles.statusDone}>Completed</Text>
                                            </View>
                                            {index < completedAppointments.length - 1 && <View style={styles.divider} />}
                                        </React.Fragment>
                                    ))}
                                </View>
                            </Animated.View>
                        )
                    }

                    <View style={{ height: 100 }} />
                </ScrollView >

                {/* ── Bottom Navigation Bar ── */}
                < View style={styles.bottomNav} >
                    <TouchableOpacity style={styles.navItem} activeOpacity={1}>
                        <Text style={styles.navIconActive}>⌂</Text>
                        <Text style={styles.navTextActive}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/drug-recommendation' as any)}>
                        <Text style={styles.navIcon}>📄</Text>
                        <Text style={styles.navText}>Records</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
                        <Text style={styles.navIcon}>🔔</Text>
                        <Text style={styles.navText}>Alerts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        activeOpacity={0.7}
                        onPress={() => router.push({
                            pathname: '/profile-setup/step1' as any,
                            params: { phone: phone ?? '' }
                        })}
                    >
                        <Text style={styles.navIcon}>👤</Text>
                        <Text style={styles.navText}>Profile</Text>
                    </TouchableOpacity>
                </View >
            </SafeAreaView >
        </View >
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1522' },
    safeArea: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    // Header
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    menuBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIcon: { color: '#3D8EFF', fontSize: 24, fontWeight: '700', marginTop: -4 },
    phcId: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
    qrBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrIcon: { fontSize: 20 },

    // Greeting
    greetingSection: { marginBottom: 32 },
    greetingHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 8
    },
    greetingText: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5 },
    greetingSub: { color: '#94A3B8', fontSize: 15 },
    switchModeBtn: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    switchModeText: { color: '#3D8EFF', fontSize: 12, fontWeight: '700' },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
        marginBottom: 36,
    },
    actionCard: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    actionImg: { width: 32, height: 32 },
    actionText: {
        color: '#3D8EFF',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Sections
    section: { marginBottom: 36 },
    sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 16 },

    // PHC Card
    phcCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
    phcHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    phcName: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
    openBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    openText: { color: '#166534', fontSize: 11, fontWeight: '800' },
    phcDistance: { color: '#64748B', fontSize: 14, marginBottom: 16 },
    phcDetails: { marginBottom: 20, gap: 8 },
    phcDetailItem: { color: '#334155', fontSize: 14, fontWeight: '500' },
    bookTokenBtn: {
        backgroundColor: '#3D8EFF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    bookTokenText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    // Reminders Card
    remindersCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20 },
    reminderRow: { flexDirection: 'row', alignItems: 'center' },
    reminderIconDone: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    reminderCheck: { color: '#16A34A', fontSize: 24, fontWeight: '800' },
    reminderTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    reminderTime: { color: '#64748B', fontSize: 13 },
    statusDone: { color: '#16A34A', fontSize: 14, fontWeight: '700' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },

    reminderIconUrgent: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    reminderAlert: { color: '#DC2626', fontSize: 28, fontWeight: '800', marginTop: 10 },
    reminderInfo: { flex: 1 },
    reminderUrgentText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
    startBtn: { backgroundColor: '#E0F2FE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    startBtnText: { color: '#0284C7', fontSize: 14, fontWeight: '700' },

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
    navIconActive: { color: '#3D8EFF', fontSize: 26 },
    navTextActive: { color: '#3D8EFF', fontSize: 11, fontWeight: '700' },
    navIcon: { color: '#64748B', fontSize: 22 },
    navText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
});
