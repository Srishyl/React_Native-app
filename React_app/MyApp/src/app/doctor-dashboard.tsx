import React, { useState } from 'react';
import { Text } from '@/components/AppText';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Alert,
    Modal,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import db from '../database/db';
import { MOCK_DOCTORS } from '../data/mock_doctors';

export default function DoctorDashboard() {
    const router = useRouter();
    const { docId, docName } = useLocalSearchParams<{ docId: string, docName: string }>();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);

    const doctorProfile = MOCK_DOCTORS.find(d => d.id === docId);

    const fetchAppointments = async () => {
        try {
            const data: any = await db.getAllAsync(
                "SELECT a.*, p.full_name as patient_name FROM appointments a LEFT JOIN patient_profiles p ON a.patient_phone = p.phone WHERE a.doctor_id = ? AND a.status IN ('pending', 'accepted') ORDER BY a.id DESC",
                [docId]
            );
            setAppointments(data || []);
        } catch (e) {
            console.error('Error fetching appointments:', e);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            if (docId) fetchAppointments();
        }, [docId])
    );

    const handleAcceptToken = async (appId: number) => {
        try {
            await db.runAsync("UPDATE appointments SET status = 'accepted' WHERE id = ?", [appId]);
            Alert.alert("Token Accepted", "The patient has been notified.");
            fetchAppointments(); // refresh list
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not accept token.");
        }
    };

    const handleMarkDone = async (appId: number) => {
        try {
            await db.runAsync("UPDATE appointments SET status = 'done' WHERE id = ?", [appId]);
            Alert.alert("Appointment Completed", "Token marked as done.");
            fetchAppointments();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                {/* ── Header ── */}
                <View style={styles.headerRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../../assets/logo.png')} style={{ width: 36, height: 36, borderRadius: 8 }} contentFit="contain" />
                    </View>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setProfileMenuVisible(true)}>
                        <MaterialIcons name="account-circle" size={30} color="#0072E9" />
                    </TouchableOpacity>
                </View>

                {/* Title Below Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
                    <Text style={styles.pageTitle}>Doctor Dashboard</Text>
                </View>

                {/* Profile Dropdown Menu */}
                <Modal visible={isProfileMenuVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProfileMenuVisible(false)}>
                        <View style={styles.profileMenu}>
                            <View style={styles.profileMenuHeader}>
                                <Image
                                    source={{ uri: doctorProfile?.image || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' }}
                                    style={styles.profileAvatarLarge}
                                />
                                <Text style={styles.profileNameLarge}>{doctorProfile?.name || docName || 'Doctor'}</Text>
                                <Text style={styles.profileSpecialty}>{doctorProfile?.specialty || 'General Practitioner'} • ID: {docId}</Text>
                            </View>

                            <View style={styles.profileStatsRow}>
                                <View style={styles.profileStatCol}>
                                    <Text style={styles.profileStatVal}>{doctorProfile?.rating || 'N/A'}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 10, marginRight: 4 }}>⭐</Text>
                                        <Text style={styles.profileStatLabel}>Rating</Text>
                                    </View>
                                </View>
                                <View style={{ width: 1, backgroundColor: '#E9E9E9', height: 24 }} />
                                <View style={styles.profileStatCol}>
                                    <Text style={styles.profileStatVal}>{doctorProfile?.experience || 'N/A'}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 10, marginRight: 4 }}>🎓</Text>
                                        <Text style={styles.profileStatLabel}>Exp</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.menuDivider} />
                            <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                                setProfileMenuVisible(false);
                                Alert.alert('Logout', 'Are you sure you want to logout?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Logout', style: 'destructive', onPress: () => router.replace('/') }
                                ]);
                            }}>
                                <MaterialIcons name="logout" size={22} color="#EF233C" />
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>


                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.metricsGrid}>
                        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={[styles.metricCard, { backgroundColor: '#0072E9' }]}>
                            <MaterialIcons name="fact-check" size={28} color="#E0E7FF" style={styles.metricIcon} />
                            <Text style={styles.metricCount}>{appointments.length}</Text>
                            <Text style={styles.metricTitle}>Total Tokens</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={[styles.metricCard, { backgroundColor: '#F59E0B' }]}>
                            <MaterialIcons name="pending-actions" size={28} color="#FEF3C7" style={styles.metricIcon} />
                            <Text style={styles.metricCount}>{appointments.filter(a => a.status === 'pending').length}</Text>
                            <Text style={styles.metricTitle}>Pending</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.metricCard, { backgroundColor: '#10B981' }]}>
                            <MaterialIcons name="check-circle" size={28} color="#D1FAE5" style={styles.metricIcon} />
                            <Text style={styles.metricCount}>{appointments.filter(a => a.status === 'accepted').length}</Text>
                            <Text style={styles.metricTitle}>Accepted</Text>
                        </Animated.View>
                    </View>

                    <Animated.View entering={FadeInUp.duration(500).delay(200)}>
                        {appointments.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyText}>No appointments booked yet.</Text>
                            </View>
                        ) : (
                            appointments.map((app) => (
                                <View key={app.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.tokenText}>Token: {app.token_id}</Text>
                                        <View style={[styles.statusBadge, app.status === 'accepted' ? styles.statusAccepted : styles.statusPending]}>
                                            <Text style={[styles.statusText, app.status === 'accepted' && styles.statusTextAccepted]}>
                                                {app.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardBody}>
                                        <MaterialIcons name="person" size={24} color="#0072E9" />
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={styles.patientPhone}>{app.patient_name || 'Patient'}</Text>
                                            <Text style={styles.appointmentTime}>Time: {app.time}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        {app.status === 'pending' && (
                                            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => handleAcceptToken(app.id)}>
                                                <MaterialIcons name="check-circle" size={18} color="#FFF" />
                                                <Text style={styles.actionBtnText}>Accept Token</Text>
                                            </TouchableOpacity>
                                        )}
                                        {app.status === 'accepted' && (
                                            <TouchableOpacity style={styles.actionBtnDone} onPress={() => handleMarkDone(app.id)}>
                                                <MaterialIcons name="done-all" size={18} color="#111827" />
                                                <Text style={styles.actionBtnTextDone}>Mark Complete</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </Animated.View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    safeArea: { flex: 1 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1.5,
        borderBottomColor: '#E9E9E9'
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
    iconButton: { padding: 4 },

    // Profile Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', alignItems: 'flex-end' },
    profileMenu: {
        backgroundColor: '#FFFFFF', width: 280,
        marginTop: Platform.OS === 'ios' ? 100 : 70, marginRight: 16,
        borderRadius: 20, padding: 20,
        shadowColor: '#0072E9', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
    },
    profileMenuHeader: { alignItems: 'center', marginBottom: 16, marginTop: 4 },
    profileAvatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', marginBottom: 12 },
    profileNameLarge: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4, textAlign: 'center' },
    profileSpecialty: { fontSize: 13, color: '#0072E9', fontWeight: '600', textAlign: 'center' },

    profileStatsRow: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 12, paddingVertical: 12, marginBottom: 16, justifyContent: 'space-evenly', alignItems: 'center' },
    profileStatCol: { alignItems: 'center', paddingHorizontal: 12 },
    profileStatVal: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
    profileStatLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },

    menuDivider: { height: 1.5, backgroundColor: '#E9E9E9', marginBottom: 12 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#FEE2E2', justifyContent: 'center' },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#EF233C', marginLeft: 12 },

    scroll: { flex: 1 },
    scrollContent: { padding: 20 },

    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12,
    },
    metricCard: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    metricIcon: {
        marginBottom: 8,
    },
    metricCount: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    metricTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.9,
    },

    emptyBox: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9CA3AF', fontSize: 16 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#E9E9E9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12, marginBottom: 12 },
    tokenText: { fontSize: 16, fontWeight: '700', color: '#111827' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusPending: { backgroundColor: '#FEF3C7' },
    statusAccepted: { backgroundColor: '#D1FAE5' },
    statusText: { fontSize: 12, fontWeight: '700', color: '#B45309' },
    statusTextAccepted: { color: '#065F46' },

    cardBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    patientPhone: { fontSize: 15, fontWeight: '600', color: '#374151' },
    appointmentTime: { fontSize: 14, color: '#6B7280', marginTop: 2 },

    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
    actionBtnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6BA259', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 6 },
    actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    actionBtnDone: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: '#E9E9E9' },
    actionBtnTextDone: { color: '#111827', fontWeight: '700', fontSize: 14 },
});
