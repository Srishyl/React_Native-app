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
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, SlideInLeft, SlideOutLeft, FadeIn, FadeOut } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import db from '../../database/db';

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NormalDashboard() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [patientName, setPatientName] = React.useState('Patient');
    const [appointments, setAppointments] = React.useState<any[]>([]);
    const [completedAppointments, setCompletedAppointments] = React.useState<any[]>([]);
    const [familyMembers, setFamilyMembers] = React.useState<any[]>([]);
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);
    const [scanModalVisible, setScanModalVisible] = React.useState(false);
    const [isScanning, setIsScanning] = React.useState(false);
    const [scanSummary, setScanSummary] = React.useState<string | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            async function loadUser() {
                let activePhone = phone;

                // Fallback: If phone param is lost (e.g. app reload), get the first profile we have
                if (!activePhone) {
                    try {
                        const fallbackUser: any = await db.getFirstAsync('SELECT phone FROM patient_profiles ORDER BY id DESC LIMIT 1');
                        if (fallbackUser && fallbackUser.phone) {
                            activePhone = fallbackUser.phone;
                        } else {
                            return; // No user logged in
                        }
                    } catch (e) {
                        return;
                    }
                }

                try {
                    const row: any = await db.getFirstAsync(
                        'SELECT full_name FROM patient_profiles WHERE phone = ?',
                        [activePhone]
                    );
                    if (row && row.full_name) {
                        setPatientName(row.full_name.split(' ')[0]);
                    }

                    // Fetch pending AND completed appointments
                    try {
                        const apps: any = await db.getAllAsync(
                            "SELECT * FROM appointments WHERE patient_phone = ? AND status = 'pending' ORDER BY id DESC",
                            [activePhone]
                        );
                        setAppointments(apps || []);

                        const completedApps: any = await db.getAllAsync(
                            "SELECT * FROM appointments WHERE patient_phone = ? AND status = 'done' ORDER BY id DESC LIMIT 5",
                            [activePhone]
                        );
                        setCompletedAppointments(completedApps || []);

                        // Fetch Family Members
                        const familyData: any = await db.getAllAsync(
                            "SELECT * FROM family_members WHERE patient_phone = ? ORDER BY id DESC",
                            [activePhone]
                        );
                        setFamilyMembers(familyData || []);
                    } catch (e) {
                        setAppointments([]);
                        setCompletedAppointments([]);
                        setFamilyMembers([]);
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

    const summarizeDocument = async (base64Data: string, mimeType: string) => {
        setIsScanning(true);
        setScanSummary(null);
        setScanModalVisible(true);

        try {
            const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
            if (!apiKey) {
                console.log("API KEY:", process.env.EXPO_PUBLIC_GEMINI_API_KEY);
                Alert.alert("API Key Missing", "Please provide your Google Gemini API Key to use this feature.");
                setIsScanning(false);
                return;
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: 'You are a helpful medical assistant. Summarize this medical document clearly, concisely, and in simple terms for a patient to understand. Point out any key takeaways.'
                            },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textContent) {
                setScanSummary(textContent);
            } else {
                setScanSummary("Could not generate a summary.");
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert("Scanning Failed", error.message || "An error occurred while summarizing the document.");
            setScanModalVisible(false);
        } finally {
            setIsScanning(false);
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required to scan.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });
        if (!result.canceled && result.assets?.[0]?.base64) {
            summarizeDocument(result.assets[0].base64, result.assets[0].mimeType || 'image/jpeg');
        }
    };

    const handleUploadBox = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery permission is required to upload.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });
        if (!result.canceled && result.assets?.[0]?.base64) {
            summarizeDocument(result.assets[0].base64, result.assets[0].mimeType || 'image/jpeg');
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
                    <Animated.View entering={FadeInDown.duration(400)} style={[styles.topBar, { justifyContent: 'flex-start' }]}>
                        <Image
                            source={require('../../../assets/logo.png')}
                            style={styles.headerLogo}
                            contentFit="contain"
                        />
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

                    {/* ── Family Details ── */}
                    {familyMembers.length > 0 && (
                        <Animated.View entering={FadeInUp.duration(500).delay(350)} style={styles.section}>
                            <Text style={styles.sectionTitle}>Family Details</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                                {familyMembers.map((member) => (
                                    <View key={member.id} style={styles.familyCard}>
                                        <Text style={styles.familyRole}>{member.relation}</Text>
                                        <Text style={styles.familyName}>{member.name}</Text>
                                        <Text style={styles.familySub}>{member.age} yrs</Text>

                                        {(member.has_bp_sugar && member.has_bp_sugar !== 'None') && (
                                            <View style={styles.familyTag}>
                                                <Text style={styles.familyTagText}>🩸 {member.has_bp_sugar}</Text>
                                            </View>
                                        )}
                                        {member.disease ? (
                                            <View style={[styles.familyTag, { backgroundColor: '#FEF08A', marginTop: 6 }]}>
                                                <Text style={[styles.familyTagText, { color: '#854D0E', fontSize: 10 }]}>⚠️ Chronic Cond.</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                ))}
                            </ScrollView>
                        </Animated.View>
                    )}

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
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    headerLogo: {
        width: 140,
        height: 48,
        marginLeft: -10,
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#3D8EFF',
    },
    profileIcon: { fontSize: 20 },
    familyBtn: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    familyBtnText: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '600',
    },
    menuBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIcon: { color: '#F8FAFC', fontSize: 24, fontWeight: '700' },
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

    // Scanner
    scannerCard: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    scannerIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#38BDF8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    scannerDesc: {
        color: '#94A3B8',
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
    scannerArrowBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
    },

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

    // Family Card
    familyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        width: 140,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    familyRole: { color: '#3D8EFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
    familyName: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginBottom: 2 },
    familySub: { color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 12 },
    familyTag: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    familyTagText: { color: '#DC2626', fontSize: 11, fontWeight: '800' },

    // FAB (Scanner)
    fabContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        top: -20,
    },
    fabButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#38BDF8',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 4,
        borderColor: '#0D1B2E',
    },
    fabIcon: {
        fontSize: 26,
    },
    fabLabel: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 6,
    },

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

    // Sidebar
    sidebarBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sidebarContent: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 280,
        backgroundColor: '#111A2C',
        borderRightWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    sidebarInner: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingHorizontal: 24,
    },
    sidebarProfileSec: { marginBottom: 40 },
    sidebarName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
    sidebarActionBtn: {
        backgroundColor: '#1E293B',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    sidebarActionText: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
    sidebarLogoutBtn: {
        backgroundColor: '#FEE2E2',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    sidebarLogoutText: { color: '#DC2626', fontSize: 16, fontWeight: '800' },

    // Scan Modal
    scanModalContent: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    scanModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    scanModalTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
    scanModalClose: { color: '#64748B', fontSize: 24, fontWeight: '600' },
    scanModalSub: { color: '#94A3B8', fontSize: 15, marginTop: 8 },
    scanOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111A2C',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    scanIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanOptionTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700' },
    scanOptionDesc: { color: '#64748B', fontSize: 13, marginTop: 4 },
});
