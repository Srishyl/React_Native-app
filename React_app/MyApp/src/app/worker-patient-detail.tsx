import React, { useEffect, useState, useCallback } from 'react';
import { Text } from '@/components/AppText';
import {
    View, ScrollView, StyleSheet, TouchableOpacity,
    StatusBar, ActivityIndicator, Platform, Alert, Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import db from '../database/db';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
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
    verification_status: string;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    updated_at: string;
};

type PregnancyDoc = {
    id: number;
    phone: string;
    doc_type: string;
    doc_base64: string;
    raw_ocr_text: string;
    extracted_edd: string | null;
    extracted_lmp: string | null;
    ocr_confidence: string;
    submitted_at: string;
    review_status: string;
    reviewed_at: string | null;
};

// ─── Helper Sub-Components ────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    if (!value || value === 'null' || value === '[]') return null;
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
                <MaterialIcons name={icon as any} size={18} color="#0072E9" />
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

// ─── Document Verification Card ───────────────────────────────────────────────
function DocVerificationCard({
    doc,
    onApprove,
    onReject,
}: {
    doc: PregnancyDoc;
    onApprove: () => void;
    onReject: () => void;
}) {
    const [imageModalVisible, setImageModalVisible] = useState(false);

    const status = doc.review_status ?? 'pending';

    const statusConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
        pending: { color: '#F59E0B', bg: '#FEF3C7', label: 'Pending Review', icon: '⏳' },
        approved: { color: '#6BA259', bg: '#E9E9E9', label: 'Approved', icon: '✅' },
        rejected: { color: '#EF233C', bg: '#FEE2E2', label: 'Rejected', icon: '❌' },
    };
    const cfg = statusConfig[status] ?? statusConfig.pending;

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.docCard}>
            {/* Status Badge */}
            <View style={[styles.docStatusBadge, { backgroundColor: cfg.bg }]}>
                <Text style={styles.docStatusIcon}>{cfg.icon}</Text>
                <Text style={[styles.docStatusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>

            {/* Doc meta */}
            <View style={styles.docMetaRow}>
                <View style={styles.docMetaItem}>
                    <Text style={styles.docMetaLabel}>Type</Text>
                    <Text style={styles.docMetaValue}>{doc.doc_type || '—'}</Text>
                </View>
                <View style={styles.docMetaItem}>
                    <Text style={styles.docMetaLabel}>Submitted</Text>
                    <Text style={styles.docMetaValue}>{formatDate(doc.submitted_at)}</Text>
                </View>
                <View style={styles.docMetaItem}>
                    <Text style={styles.docMetaLabel}>OCR</Text>
                    <Text style={[styles.docMetaValue, { color: doc.ocr_confidence === 'high' ? '#6BA259' : '#F59E0B' }]}>
                        {doc.ocr_confidence === 'high' ? '✓ High' : '~ Low'}
                    </Text>
                </View>
            </View>

            {/* OCR Dates */}
            {(doc.extracted_edd || doc.extracted_lmp) && (
                <View style={styles.ocrDatesRow}>
                    {doc.extracted_edd && (
                        <View style={styles.ocrDateBox}>
                            <Text style={styles.ocrDateLabel}>EDD (Due Date)</Text>
                            <Text style={styles.ocrDateValue}>{doc.extracted_edd}</Text>
                        </View>
                    )}
                    {doc.extracted_lmp && (
                        <View style={styles.ocrDateBox}>
                            <Text style={styles.ocrDateLabel}>LMP</Text>
                            <Text style={styles.ocrDateValue}>{doc.extracted_lmp}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Document Image Thumbnail */}
            {doc.doc_base64 ? (
                <TouchableOpacity
                    style={styles.docImageThumb}
                    onPress={() => setImageModalVisible(true)}
                    activeOpacity={0.85}
                >
                    <Image
                        source={{ uri: doc.doc_base64 }}
                        style={styles.thumbImage}
                        contentFit="cover"
                    />
                    <View style={styles.thumbOverlay}>
                        <Text style={styles.thumbOverlayText}>🔍 Tap to view full image</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={styles.noImageBox}>
                    <Text style={styles.noImageText}>📄 No image available</Text>
                </View>
            )}

            {/* Approve / Reject Buttons — only show if still pending */}
            {status === 'pending' && (
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={onReject}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.rejectBtnText}>✕  Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={onApprove}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.approveBtnText}>✓  Approve</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* If already reviewed */}
            {status !== 'pending' && doc.reviewed_at && (
                <Text style={styles.reviewedAtText}>
                    Reviewed on {formatDate(doc.reviewed_at)}
                </Text>
            )}

            {/* Full-screen image modal */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setImageModalVisible(false)}
            >
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity
                        style={styles.imageModalClose}
                        onPress={() => setImageModalVisible(false)}
                    >
                        <Text style={styles.imageModalCloseText}>✕ Close</Text>
                    </TouchableOpacity>
                    <Image
                        source={{ uri: doc.doc_base64 }}
                        style={styles.fullImage}
                        contentFit="contain"
                    />
                </View>
            </Modal>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WorkerPatientDetailScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [doc, setDoc] = useState<PregnancyDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);

    const langMap: Record<string, string> = { en: 'English', kn: 'Kannada', hi: 'Hindi', ta: 'Tamil' };

    const loadData = useCallback(async () => {
        if (!phone) return;
        try {
            const row: any = await db.getFirstAsync(
                `SELECT phone, full_name, age, gender, village, pincode,
                        language_preference, emergency_contact, known_allergies,
                        chronic_conditions, care_mode, verification_status,
                        latitude, longitude, created_at, updated_at
                 FROM patient_profiles WHERE phone = ?`,
                [phone]
            );
            setProfile(row || null);

            // Load latest submitted pregnancy document
            const docRow: any = await db.getFirstAsync(
                `SELECT * FROM pregnancy_documents WHERE phone = ? ORDER BY submitted_at DESC LIMIT 1`,
                [phone]
            );
            setDoc(docRow || null);
        } catch (e) {
            console.error('Error fetching patient profile:', e);
            Alert.alert('Error', 'Could not load patient details.');
        } finally {
            setLoading(false);
        }
    }, [phone]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadData();
        }, [loadData])
    );

    // ── Approve handler ────────────────────────────────────────────────────────
    const handleApprove = () => {
        Alert.alert(
            'Approve Document',
            'Approving this document will activate the patient\'s pregnancy dashboard. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        if (!doc) return;
                        setReviewing(true);
                        try {
                            const now = new Date().toISOString();
                            // Update document review status
                            await db.runAsync(
                                `UPDATE pregnancy_documents SET review_status = 'approved', reviewed_at = ? WHERE id = ?`,
                                [now, doc.id]
                            );
                            // Update patient profile — pregnancy verified
                            await db.runAsync(
                                `UPDATE patient_profiles
                                 SET verification_status = 'approved',
                                     pregnancy_verified = 1,
                                     updated_at = ?
                                 WHERE phone = ?`,
                                [now, phone]
                            );
                            await loadData();
                            Alert.alert('✅ Approved', 'Pregnancy has been verified. Patient can now access the pregnancy dashboard.');
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Error', 'Could not update status.');
                        } finally {
                            setReviewing(false);
                        }
                    },
                },
            ]
        );
    };

    // ── Reject handler ─────────────────────────────────────────────────────────
    const handleReject = () => {
        Alert.alert(
            'Reject Document',
            'The patient will be asked to re-upload a clearer document.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        if (!doc) return;
                        setReviewing(true);
                        try {
                            const now = new Date().toISOString();
                            await db.runAsync(
                                `UPDATE pregnancy_documents SET review_status = 'rejected', reviewed_at = ? WHERE id = ?`,
                                [now, doc.id]
                            );
                            await db.runAsync(
                                `UPDATE patient_profiles
                                 SET verification_status = 'rejected',
                                     pregnancy_verified = 0,
                                     updated_at = ?
                                 WHERE phone = ?`,
                                [now, phone]
                            );
                            await loadData();
                            Alert.alert('❌ Rejected', 'Document has been rejected. Patient will be notified to re-upload.');
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Error', 'Could not update status.');
                        } finally {
                            setReviewing(false);
                        }
                    },
                },
            ]
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────────
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
    const careColor = isPregnancy ? '#EF233C' : '#6BA259';
    const careBg = isPregnancy ? '#FEE2E2' : '#E9E9E9';
    const careLabel = isPregnancy ? '🤰 Pregnancy' : '💼 Normal Care';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>

                {/* ── Header ── */}
                <View style={styles.headerRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../../assets/logo.png')} style={{ width: 36, height: 36, borderRadius: 8 }} contentFit="contain" />
                    </View>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialIcons name="close" size={28} color="#0072E9" />
                    </TouchableOpacity>
                </View>

                {/* Title Below Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
                    <Text style={styles.pageTitle}>Patient Profile</Text>
                </View>

                {reviewing && (
                    <View style={styles.reviewingBanner}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.reviewingText}>Saving decision…</Text>
                    </View>
                )}

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Hero Card ──────────────────────────────────────── */}
                    <View style={styles.heroCard}>
                        <View style={styles.avatarIconBox}>
                            <MaterialIcons name="account-circle" size={72} color="#0072E9" />
                        </View>
                        <View style={[styles.careBadge, { backgroundColor: careBg }]}>
                            <Text style={[styles.careBadgeText, { color: careColor }]}>{careLabel}</Text>
                        </View>
                        <Text style={styles.heroName}>{profile.full_name || '—'}</Text>
                        <View style={styles.heroPhoneRow}>
                            <MaterialIcons name="phone" size={15} color="#6B7280" style={{ marginRight: 4 }} />
                            <Text style={styles.heroPhone}>{profile.phone}</Text>
                        </View>
                        <View style={styles.heroTagRow}>
                            {profile.age ? <View style={styles.heroTag}><Text style={styles.heroTagText}>{profile.age} yrs</Text></View> : null}
                            {profile.gender ? <View style={styles.heroTag}><Text style={styles.heroTagText}>{profile.gender}</Text></View> : null}
                            {profile.village ? <View style={styles.heroTag}><Text style={styles.heroTagText}>{profile.village}</Text></View> : null}
                        </View>
                    </View>

                    {/* ── Pregnancy Document Verification ───────────────── */}
                    {isPregnancy && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Pregnancy Document Verification</Text>
                            {doc ? (
                                <DocVerificationCard
                                    doc={doc}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                            ) : (
                                <View style={styles.noDocBox}>
                                    <MaterialIcons name="inbox" size={40} color="#6B7280" style={{ marginBottom: 12, opacity: 0.7 }} />
                                    <Text style={styles.noDocText}>No document submitted yet</Text>
                                    <Text style={styles.noDocSub}>Patient hasn't uploaded a pregnancy document.</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ── Location ───────────────────────────────────────── */}
                    <Section title="Location">
                        <InfoRow icon="location-city" label="Village / Area" value={profile.village || '—'} />
                        <InfoRow icon="pin-drop" label="Pincode" value={profile.pincode || '—'} />
                        <InfoRow icon="public" label="Coordinates"
                            value={
                                profile.latitude && profile.longitude
                                    ? `${profile.latitude.toFixed(5)}, ${profile.longitude.toFixed(5)}`
                                    : 'Not recorded'
                            }
                        />
                    </Section>

                    {/* ── Health Information ─────────────────────────────── */}
                    <Section title="Health Information">
                        <InfoRow icon="local-hospital" label="Care Mode" value={isPregnancy ? 'Pregnancy' : 'Normal'} />
                        <InfoRow icon="medication" label="Known Allergies" value={parseJsonArray(profile.known_allergies)} />
                        <InfoRow icon="favorite" label="Chronic Conditions" value={parseJsonArray(profile.chronic_conditions)} />
                    </Section>

                    {/* ── Personal Details ───────────────────────────────── */}
                    <Section title="Personal Details">
                        <InfoRow icon="translate" label="Language" value={langMap[profile.language_preference] || profile.language_preference || '—'} />
                        <InfoRow icon="contact-emergency" label="Emergency Contact" value={profile.emergency_contact || '—'} />
                        <InfoRow icon="event" label="Profile Created" value={formatDate(profile.created_at)} />
                        <InfoRow icon="update" label="Last Updated" value={formatDate(profile.updated_at)} />
                    </Section>

                    {/* ── Action Buttons ─────────────────────────────────── */}
                    <View style={styles.bottomActionRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <MaterialIcons name="note-add" size={20} color="#111827" />
                            <Text style={styles.actionLabel}>Add Visit Note</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnTeal]}>
                            <MaterialIcons name="phone" size={20} color="#fff" />
                            <Text style={[styles.actionLabel, { color: '#fff' }]}>Call Patient</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    safeArea: { flex: 1 },
    centered: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#6B7280', fontSize: 16, marginBottom: 20 },
    backBtnCentered: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0072E9', borderRadius: 12 },
    backBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

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
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
    iconButton: { padding: 4 },

    reviewingBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#0072E9', paddingVertical: 10, paddingHorizontal: 20,
    },
    reviewingText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

    scroll: { paddingHorizontal: 16, paddingTop: 16 },

    // Hero
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24, padding: 24, alignItems: 'center',
        marginBottom: 16, borderWidth: 1.5, borderColor: '#E9E9E9',
        shadowColor: '#0072E9', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12, borderWidth: 3, borderColor: '#0072E9' },
    careBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
    careBadgeText: { fontSize: 13, fontWeight: '700' },
    heroName: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4, textAlign: 'center' },
    heroPhone: { fontSize: 14, color: '#6B7280' },
    avatarIconBox: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: '#E9E9E9', justifyContent: 'center', alignItems: 'center',
        marginBottom: 12, borderWidth: 2, borderColor: '#E9E9E9',
    },
    heroPhoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    heroTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    heroTag: { backgroundColor: '#E9E9E9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    heroTagText: { color: '#374151', fontSize: 13, fontWeight: '600' },

    // Section
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0072E9', marginBottom: 8, marginLeft: 4 },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16, borderWidth: 1.5, borderColor: '#E9E9E9', overflow: 'hidden',
        shadowColor: '#0072E9', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
    },

    // Info Rows
    infoRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#E9E9E9',
    },
    infoIconBox: {
        width: 36, height: 36, backgroundColor: '#E9E9E9',
        borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    infoIcon: { fontSize: 16 },
    infoTextCol: { flex: 1 },
    infoLabel: { fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 15, color: '#111827', fontWeight: '500' },

    // Doc Card
    docCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20, borderWidth: 1.5, borderColor: '#E9E9E9',
        padding: 16, gap: 14,
        shadowColor: '#0072E9', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    },
    docStatusBadge: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
    },
    docStatusIcon: { fontSize: 16 },
    docStatusText: { fontWeight: '800', fontSize: 14 },

    docMetaRow: { flexDirection: 'row', gap: 12 },
    docMetaItem: {
        flex: 1, backgroundColor: '#F8F9FA',
        borderRadius: 12, padding: 12, alignItems: 'center',
        borderWidth: 1, borderColor: '#E9E9E9',
    },
    docMetaLabel: { color: '#6B7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    docMetaValue: { color: '#111827', fontSize: 13, fontWeight: '700', textAlign: 'center' },

    ocrDatesRow: { flexDirection: 'row', gap: 12 },
    ocrDateBox: {
        flex: 1, backgroundColor: '#E9E9E9',
        borderRadius: 12, padding: 12,
        borderWidth: 1.5, borderColor: '#E9E9E9',
    },
    ocrDateLabel: { color: '#374151', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    ocrDateValue: { color: '#111827', fontSize: 14, fontWeight: '700' },

    docImageThumb: { borderRadius: 16, overflow: 'hidden', height: 200, backgroundColor: '#E9E9E9' },
    thumbImage: { width: '100%', height: '100%' },
    thumbOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 14,
    },
    thumbOverlayText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

    noImageBox: {
        height: 120, backgroundColor: '#F8F9FA',
        borderRadius: 16, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#E9E9E9', borderStyle: 'dashed',
    },
    noImageText: { color: '#6B7280', fontSize: 15 },

    actionRow: { flexDirection: 'row', gap: 12 },
    rejectBtn: {
        flex: 1, backgroundColor: '#FEE2E2',
        borderRadius: 14, paddingVertical: 16, alignItems: 'center',
        borderWidth: 1.5, borderColor: '#EF233C',
    },
    rejectBtnText: { color: '#EF233C', fontSize: 16, fontWeight: '800' },
    approveBtn: {
        flex: 1, backgroundColor: '#6BA259',
        borderRadius: 14, paddingVertical: 16, alignItems: 'center',
        shadowColor: '#6BA259', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
    },
    approveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

    reviewedAtText: { color: '#6B7280', fontSize: 12, textAlign: 'center', fontStyle: 'italic' },

    // No doc
    noDocBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20, borderWidth: 1.5, borderColor: '#E9E9E9',
        padding: 32, alignItems: 'center',
    },
    noDocIcon: { fontSize: 40, marginBottom: 12, opacity: 0.4 },
    noDocText: { color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    noDocSub: { color: '#6B7280', fontSize: 13, textAlign: 'center' },

    // Full-screen image modal
    imageModalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center', alignItems: 'center',
    },
    imageModalClose: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 36, right: 20,
        backgroundColor: '#EF233C',
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, zIndex: 10,
    },
    imageModalCloseText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    fullImage: { width: SCREEN_W, height: SCREEN_W * 1.3 },

    // Bottom Actions
    bottomActionRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 4 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 16,
        borderWidth: 1.5, borderColor: '#E9E9E9',
    },
    actionBtnTeal: { backgroundColor: '#0072E9', borderColor: '#0072E9' },
    actionIcon: { fontSize: 18 },
    actionLabel: { color: '#111827', fontSize: 14, fontWeight: '700' },
});
