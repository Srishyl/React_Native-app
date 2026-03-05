import React, { useEffect, useState } from 'react';
import { Text } from '@/components/AppText';
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    StatusBar, ActivityIndicator, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import db from '../database/db';

const AVATAR = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300';

type PatientProfile = {
    phone: string;
    full_name: string;
    age: string;
    gender: string;
    village: string;
    pincode: string;
    language_preference: string;
    emergency_contact: string;
    known_allergies: string;
    chronic_conditions: string;
    care_mode: string;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    updated_at: string;
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    if (!value || value === 'null' || value === '[]') return null;
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>{icon}</Text>
            </View>
            <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionCard}>{children}</View>
        </View>
    );
}

function parseJsonArray(raw: string): string {
    try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return arr.join(', ');
    } catch (_) { }
    return raw || '—';
}

function formatDate(iso: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function WorkerPatientDetailScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const row: any = await db.getFirstAsync(
                    `SELECT phone, full_name, age, gender, village, pincode,
                            language_preference, emergency_contact, known_allergies,
                            chronic_conditions, care_mode, latitude, longitude,
                            created_at, updated_at
                     FROM patient_profiles WHERE phone = ?`,
                    [phone]
                );
                setProfile(row || null);
            } catch (e) {
                console.error('Error fetching patient profile:', e);
                Alert.alert('Error', 'Could not load patient details.');
            } finally {
                setLoading(false);
            }
        };
        if (phone) fetchProfile();
    }, [phone]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0d9488" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Patient profile not found.</Text>
                <TouchableOpacity style={styles.backBtnCentered} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>← Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isPregnancy = profile.care_mode === 'pregnancy';
    const careColor = isPregnancy ? '#EF4444' : '#10B981';
    const careBg = isPregnancy ? '#FEE2E2' : '#D1FAE5';
    const careLabel = isPregnancy ? '🤰 Pregnancy' : '💼 Normal Care';

    const langMap: Record<string, string> = { en: 'English', kn: 'Kannada', hi: 'Hindi', ta: 'Tamil' };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Patient Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Hero Card ──────────────────────────────────────── */}
                    <View style={styles.heroCard}>
                        <Image source={{ uri: AVATAR }} style={styles.avatar} />
                        <View style={[styles.careBadge, { backgroundColor: careBg }]}>
                            <Text style={[styles.careBadgeText, { color: careColor }]}>{careLabel}</Text>
                        </View>
                        <Text style={styles.heroName}>{profile.full_name || '—'}</Text>
                        <Text style={styles.heroPhone}>📞 {profile.phone}</Text>
                        <View style={styles.heroTagRow}>
                            {profile.age ? <View style={styles.heroTag}><Text style={styles.heroTagText}>{profile.age} yrs</Text></View> : null}
                            {profile.gender ? <View style={styles.heroTag}><Text style={styles.heroTagText}>{profile.gender}</Text></View> : null}
                            {profile.village ? <View style={styles.heroTag}><Text style={styles.heroTagText}>{profile.village}</Text></View> : null}
                        </View>
                    </View>

                    {/* ── Location ───────────────────────────────────────── */}
                    <Section title="📍 Location">
                        <InfoRow icon="🏘️" label="Village / Area" value={profile.village || '—'} />
                        <InfoRow icon="📮" label="Pincode" value={profile.pincode || '—'} />
                        <InfoRow icon="🌐" label="Coordinates"
                            value={
                                profile.latitude && profile.longitude
                                    ? `${profile.latitude.toFixed(5)}, ${profile.longitude.toFixed(5)}`
                                    : 'Not recorded'
                            }
                        />
                    </Section>

                    {/* ── Health Information ─────────────────────────────── */}
                    <Section title="🏥 Health Information">
                        <InfoRow icon="🩺" label="Care Mode" value={isPregnancy ? 'Pregnancy' : 'Normal'} />
                        <InfoRow icon="💊" label="Known Allergies" value={parseJsonArray(profile.known_allergies)} />
                        <InfoRow icon="🫀" label="Chronic Conditions" value={parseJsonArray(profile.chronic_conditions)} />
                    </Section>

                    {/* ── Personal Details ───────────────────────────────── */}
                    <Section title="👤 Personal Details">
                        <InfoRow icon="🗣️" label="Language" value={langMap[profile.language_preference] || profile.language_preference || '—'} />
                        <InfoRow icon="📞" label="Emergency Contact" value={profile.emergency_contact || '—'} />
                        <InfoRow icon="📅" label="Profile Created" value={formatDate(profile.created_at)} />
                        <InfoRow icon="🔄" label="Last Updated" value={formatDate(profile.updated_at)} />
                    </Section>

                    {/* ── Action Buttons ─────────────────────────────────── */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={styles.actionIcon}>📋</Text>
                            <Text style={styles.actionLabel}>Add Visit Note</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnTeal]}>
                            <Text style={styles.actionIcon}>📞</Text>
                            <Text style={[styles.actionLabel, { color: '#fff' }]}>Call Patient</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1B2E' },
    safeArea: { flex: 1 },
    centered: { flex: 1, backgroundColor: '#0D1B2E', justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#9BB4D0', fontSize: 16, marginBottom: 20 },
    backBtnCentered: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0d9488', borderRadius: 12 },
    backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E3A5A',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backArrow: { fontSize: 22, color: '#ffffff', fontWeight: '600' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#fff' },

    scroll: { paddingHorizontal: 16, paddingTop: 16 },

    heroCard: {
        backgroundColor: '#132236',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1E3A5A',
    },
    avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12, borderWidth: 3, borderColor: '#0d9488' },
    careBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
    careBadgeText: { fontSize: 13, fontWeight: '700' },
    heroName: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 4, textAlign: 'center' },
    heroPhone: { fontSize: 14, color: '#9BB4D0', marginBottom: 12 },
    heroTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    heroTag: { backgroundColor: '#1E3A5A', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    heroTagText: { color: '#C8D8EA', fontSize: 13, fontWeight: '500' },

    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#9BB4D0', marginBottom: 8, marginLeft: 4 },
    sectionCard: {
        backgroundColor: '#132236',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E3A5A',
        overflow: 'hidden',
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E3A5A20',
    },
    infoIconBox: {
        width: 36,
        height: 36,
        backgroundColor: '#1E3A5A',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoIcon: { fontSize: 16 },
    infoTextCol: { flex: 1 },
    infoLabel: { fontSize: 11, color: '#6B8BAE', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 15, color: '#E2EAF4', fontWeight: '500' },

    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 4,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#132236',
        borderRadius: 14,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#1E3A5A',
    },
    actionBtnTeal: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
    actionIcon: { fontSize: 18 },
    actionLabel: { color: '#C8D8EA', fontSize: 14, fontWeight: '700' },
});
