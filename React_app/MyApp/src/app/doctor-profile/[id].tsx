import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { MOCK_DOCTORS } from '../../data/mock_doctors';
import db from '../../database/db';

export default function DoctorProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [booking, setBooking] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [patientPhone, setPatientPhone] = useState<string | null>(null);
    const [patientId, setPatientId] = useState<number | null>(null);

    // Find the specific doctor from mock data
    const doctor = MOCK_DOCTORS.find(d => d.id === id);

    // We need the current user's phone to book against their profile
    useEffect(() => {
        async function getPhone() {
            try {
                // To keep it simple, we just grab the first profile since it's a single-user device usually.
                // In a production app with auth, you'd use a secure global state or Context API.
                const profile: any = await db.getFirstAsync('SELECT id, phone, care_mode FROM patient_profiles LIMIT 1');
                if (profile && profile.phone) {
                    setPatientPhone(profile.phone);
                    setPatientId(profile.id);
                }
            } catch (err) {
                console.error('Error fetching phone for booking:', err);
            }
        }
        getPhone();
    }, []);

    const handleBookToken = async () => {
        if (!selectedSlot) {
            Alert.alert('Select Slot', 'Please select an available time slot to book.');
            return;
        }

        if (!patientPhone || !patientId) {
            Alert.alert('Error', 'Unable to retrieve your user profile. Please login again.');
            return;
        }

        setBooking(true);
        try {
            // Drop old structure so we can re-create with the new columns cleanly
            await db.execAsync(`DROP TABLE IF EXISTS appointments;`);

            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS appointments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token_id TEXT NOT NULL,
                    patient_id INTEGER NOT NULL,
                    patient_phone TEXT NOT NULL,
                    doctor_id TEXT NOT NULL,
                    doctor_name TEXT NOT NULL,
                    specialty TEXT NOT NULL,
                    time TEXT NOT NULL,
                    status TEXT DEFAULT 'pending'
                );
            `);

            // Generate token sequence (e.g. token1, token2)
            const countResult: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM appointments');
            const tokenCount = countResult ? countResult.count : 0;
            const nextTokenId = `token${tokenCount + 1}`;

            // Insert the appointment
            await db.runAsync(
                `INSERT INTO appointments(token_id, patient_id, patient_phone, doctor_id, doctor_name, specialty, time, status)
            VALUES(?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [nextTokenId, patientId, patientPhone, doctor?.id || '', doctor?.name || '', doctor?.specialty || '', selectedSlot]
            );

            // Fetch care_mode to redirect safely to the correct dashboard
            const profile: any = await db.getFirstAsync('SELECT care_mode FROM patient_profiles WHERE phone = ?', [patientPhone]);

            Alert.alert(
                'Token Booked!',
                `Your appointment with ${doctor?.name} is confirmed for ${selectedSlot}.`,
                [{
                    text: 'Go to Dashboard',
                    onPress: () => {
                        if (profile.care_mode === 'pregnancy') {
                            router.replace({ pathname: '/dashboards/pregnancy' as any, params: { phone: patientPhone } });
                        } else {
                            router.replace({ pathname: '/dashboards/normal' as any, params: { phone: patientPhone } });
                        }
                    }
                }]
            );

        } catch (error) {
            console.error('Booking Error:', error);
            Alert.alert('Error', 'Failed to book token. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    if (!doctor) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#FFF' }}>Doctor not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#3D8EFF' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Doctor Profile</Text>
                    <View style={{ width: 60 }} />
                </Animated.View>

                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── Doctor Card ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.profileCard}>
                        <Image
                            source={{ uri: doctor.image }}
                            style={styles.doctorImgLarge}
                            contentFit="cover"
                        />
                        <Text style={styles.doctorName}>{doctor.name}</Text>
                        <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>

                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>⭐{doctor.rating}</Text>
                                <Text style={styles.statLabel}>Rating</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>🎓{doctor.experience}</Text>
                                <Text style={styles.statLabel}>Experience</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>📍{doctor.distance}</Text>
                                <Text style={styles.statLabel}>Distance</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* ── About ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.aboutText}>{doctor.about}</Text>
                    </Animated.View>

                    {/* ── Time Slots ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Available Today</Text>
                        <View style={styles.slotGrid}>
                            {doctor.availableSlots.map((slot) => {
                                const isSelected = selectedSlot === slot;
                                return (
                                    <TouchableOpacity
                                        key={slot}
                                        style={[styles.slotCard, isSelected && styles.slotCardActive]}
                                        onPress={() => setSelectedSlot(slot)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
                                            {slot}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Animated.View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── Bottom Book Bar ── */}
                <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.bookBtn, (!selectedSlot || booking) && styles.bookBtnDisabled]}
                        onPress={handleBookToken}
                        disabled={!selectedSlot || booking}
                        activeOpacity={0.85}
                    >
                        {booking ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.bookBtnText}>Book Token Now</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1B2E' },
    safeArea: { flex: 1 },
    scroll: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 10,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: '#3D8EFF', fontSize: 16, fontWeight: '600' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

    profileCard: {
        alignItems: 'center',
        padding: 24,
        margin: 20,
        backgroundColor: '#132236',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#1E3A5A',
    },
    doctorImgLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1E3A5A',
        borderWidth: 3,
        borderColor: '#3D8EFF',
        marginBottom: 16,
    },
    doctorName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 6 },
    doctorSpecialty: { color: '#3D8EFF', fontSize: 15, fontWeight: '600', marginBottom: 20 },

    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#1E3A5A',
    },
    statBox: { alignItems: 'center', flex: 1 },
    statNumber: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    statLabel: { color: '#9BB4D0', fontSize: 12, fontWeight: '500' },

    section: { paddingHorizontal: 24, marginTop: 10, marginBottom: 10 },
    sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 12 },
    aboutText: { color: '#9BB4D0', fontSize: 14, lineHeight: 22 },

    slotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    slotCard: {
        width: '47%',
        backgroundColor: '#1E3A5A',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    slotCardActive: {
        backgroundColor: '#3D8EFF15',
        borderColor: '#3D8EFF',
    },
    slotText: { color: '#9BB4D0', fontSize: 14, fontWeight: '600' },
    slotTextActive: { color: '#3D8EFF', fontWeight: '800' },

    bottomBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        paddingHorizontal: 24,
        paddingBottom: 24, // adjust for safe area if iOS
        paddingTop: 16,
        backgroundColor: '#0D1B2E',
        borderTopWidth: 1,
        borderTopColor: '#1E3A5A',
    },
    bookBtn: {
        backgroundColor: '#3D8EFF',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#3D8EFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    bookBtnDisabled: { backgroundColor: '#1E3A5A', shadowOpacity: 0 },
    bookBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
