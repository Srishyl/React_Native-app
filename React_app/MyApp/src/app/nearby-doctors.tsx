import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MOCK_DOCTORS } from '../data/mock_doctors';

export default function NearbyDoctorsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nearby Doctors</Text>
                    <View style={{ width: 60 }} /> {/* Spacer */}
                </Animated.View>

                {/* ── Title ── */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.titleContainer}>
                    <Text style={styles.title}>Available Specialists</Text>
                    <Text style={styles.subtitle}>Find and book appointments with top-rated doctors in your area.</Text>
                </Animated.View>

                {/* ── List of Doctors ── */}
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {MOCK_DOCTORS.map((doctor, index) => (
                        <Animated.View
                            key={doctor.id}
                            entering={FadeInUp.duration(400).delay(200 + (index * 50))}
                            style={styles.card}
                        >
                            <View style={styles.cardHeader}>
                                <Image
                                    source={{ uri: doctor.image }}
                                    style={styles.doctorImg}
                                    contentFit="cover"
                                />
                                <View style={styles.cardInfo}>
                                    <Text style={styles.doctorName}>{doctor.name}</Text>
                                    <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>

                                    <View style={styles.statsRow}>
                                        <Text style={styles.statText}>⭐ {doctor.rating}</Text>
                                        <Text style={styles.statDivider}>•</Text>
                                        <Text style={styles.statText}>🎓 {doctor.experience}</Text>
                                        <Text style={styles.statDivider}>•</Text>
                                        <Text style={styles.statText}>📍 {doctor.distance}</Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.bookBtn}
                                onPress={() => router.push(`/doctor-profile/${doctor.id}` as any)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.bookBtnText}>View Profile & Book</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1B2E' },
    safeArea: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: '#3D8EFF', fontSize: 16, fontWeight: '600' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

    titleContainer: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#9BB4D0', lineHeight: 22 },

    scroll: { flex: 1 },
    listContent: { paddingHorizontal: 20, paddingTop: 10 },

    card: {
        backgroundColor: '#132236',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1E3A5A',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    doctorImg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1E3A5A',
        borderWidth: 2,
        borderColor: '#3D8EFF',
    },
    cardInfo: { flex: 1, marginLeft: 16 },
    doctorName: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
    doctorSpecialty: { color: '#3D8EFF', fontSize: 14, fontWeight: '600', marginBottom: 8 },

    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: { color: '#9BB4D0', fontSize: 12, fontWeight: '500' },
    statDivider: { color: '#4A6280', fontSize: 12, marginHorizontal: 6 },

    bookBtn: {
        backgroundColor: '#3D8EFF',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    bookBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
