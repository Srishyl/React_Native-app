import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Alert,
    Platform,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import db from '../../database/db';

const DOC_TYPES = ['USG Report', 'ANC Card', 'Doctor Certificate', 'Home Test'];

export default function Step2Upload() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [selectedDoc, setSelectedDoc] = useState('USG Report');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [ocrStatus, setOcrStatus] = useState<'idle' | 'running' | 'done' | 'skipped'>('idle');

    // OCR Service — Standalone, runs on port 8082
    // Your PC's local IP so the Android device can reach it
    const OCR_SERVICE_URL = 'http://192.168.220.209:8083';

    const handleSelectFile = () => {
        setShowOptions(true);
    };

    const handleOptionSelect = async (type: 'camera' | 'gallery') => {
        setShowOptions(false);
        let result: ImagePicker.ImagePickerResult;
        try {
            if (type === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Camera access is needed.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    quality: 0.8,
                    base64: true,  // get base64 directly — no FileReader needed
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Gallery access is needed.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    quality: 0.8,
                    base64: true,  // get base64 directly — no FileReader needed
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
                setImageBase64(result.assets[0].base64 ?? null);
                setOcrStatus('idle');
            }
        } catch (err) {
            console.error('Image selection error:', err);
            Alert.alert('Error', 'Failed to pick an image.');
        }
    };

    const handleSubmit = async () => {
        if (!imageUri) {
            Alert.alert('Required', 'Please select a file to upload.');
            return;
        }

        setIsSubmitting(true);
        try {
            const submittedAt = new Date().toISOString();

            // base64 from picker (no FileReader needed — works in React Native)
            const base64Data = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : imageUri;

            // 2. Call OCR service to extract dates
            let extractedEdd: string | null = null;
            let extractedLmp: string | null = null;
            let rawOcrText = '';
            let ocrConfidence = 'low';

            setOcrStatus('running');
            try {
                const formData = new FormData();
                formData.append('file', {
                    uri: imageUri,
                    type: 'image/jpeg',
                    name: 'document.jpg',
                } as any);

                const ocrResponse = await fetch(`${OCR_SERVICE_URL}/extract`, {
                    method: 'POST',
                    body: formData,
                });

                if (ocrResponse.ok) {
                    const ocrResult = await ocrResponse.json();
                    extractedEdd = ocrResult.edd ?? null;
                    extractedLmp = ocrResult.lmp ?? null;
                    rawOcrText = ocrResult.raw_text ?? '';
                    ocrConfidence = ocrResult.confidence ?? 'low';
                    setOcrStatus('done');
                } else {
                    setOcrStatus('skipped');
                }
            } catch (ocrErr) {
                // OCR service unavailable — proceed without extraction
                console.warn('OCR service unavailable:', ocrErr);
                setOcrStatus('skipped');
            }

            // 3. Save document + OCR results to pregnancy_documents table
            await db.runAsync(
                `INSERT OR REPLACE INTO pregnancy_documents
                 (phone, doc_type, doc_base64, raw_ocr_text, extracted_edd, extracted_lmp, ocr_confidence, submitted_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [phone ?? '', selectedDoc, base64Data, rawOcrText, extractedEdd, extractedLmp, ocrConfidence, submittedAt]
            );

            // 4. Pre-fill pregnancy_records if OCR found dates
            if (extractedEdd || extractedLmp) {
                const startDate = extractedLmp ?? new Date().toISOString().split('T')[0];
                const edd = extractedEdd ?? (() => {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + 280);
                    return d.toISOString().split('T')[0];
                })();
                await db.runAsync(
                    `INSERT OR REPLACE INTO pregnancy_records (phone, edd, pregnancy_start_date, created_at)
                     VALUES (?, ?, ?, ?)`,
                    [phone ?? '', edd, startDate, submittedAt]
                );
            }

            // 5. Update patient_profiles — pending CHW verification
            await db.runAsync(
                `UPDATE patient_profiles
                 SET verification_status = 'pending',
                     verification_method = 'document',
                     pregnancy_doc_type = ?,
                     pregnancy_doc_uri = ?,
                     updated_at = ?
                 WHERE phone = ?`,
                [selectedDoc, imageUri, submittedAt, phone ?? '']
            );

            router.push({
                pathname: '/pregnancy-activation/step3' as any,
                params: { phone: phone ?? '', ocr_edd: extractedEdd ?? '', ocr_confidence: ocrConfidence }
            });
        } catch (err) {
            console.error('Submit error:', err);
            Alert.alert('Error', 'Failed to submit for review.');
        } finally {
            setIsSubmitting(false);
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
                        <Text style={styles.headerTitle}>Step 2: Document Upload</Text>
                        <View style={{ width: 40 }} />
                    </Animated.View>

                    {/* ── Select Doc Type ── */}
                    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
                        <Text style={styles.sectionTitle}>Select Document Type</Text>
                        <View style={styles.chipGrid}>
                            {DOC_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.chip, selectedDoc === type && styles.chipActive]}
                                    onPress={() => setSelectedDoc(type)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.chipText, selectedDoc === type && styles.chipTextActive]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>

                    {/* ── Upload Area ── */}
                    <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.uploadArea}>
                        <View style={styles.uploadDashedBox}>
                            <View style={styles.uploadIcons}>
                                <View style={styles.iconCircle}>
                                    <Text style={styles.iconText}>📷</Text>
                                </View>
                                <View style={styles.iconCircle}>
                                    <Text style={styles.iconText}>🖼️</Text>
                                </View>
                            </View>
                            <Text style={styles.uploadTitle}>Capture or Upload</Text>
                            <Text style={styles.uploadSubtitle}>
                                Take a clear photo of your document or select an image from your gallery
                            </Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={handleSelectFile} activeOpacity={0.8}>
                                <Text style={styles.selectBtnText}>Select File</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* ── Preview ── */}
                    <Animated.View entering={FadeInUp.duration(400).delay(300)}>
                        <Text style={styles.sectionTitle}>Preview</Text>
                        <View style={styles.previewContainer}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="contain" />
                            ) : (
                                <View style={styles.previewPlaceholder}>
                                    <Text style={styles.placeholderIcon}>📄</Text>
                                    <Text style={styles.placeholderText}>
                                        No image uploaded yet. A preview will appear here once you select a file.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>

                </ScrollView>

                {/* ── Selection Modal ── */}
                <Modal
                    visible={showOptions}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowOptions(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowOptions(false)}
                    >
                        <Animated.View entering={FadeInUp.duration(300)} style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <View style={styles.modalHandle} />
                                <Text style={styles.modalTitle}>Choose Image Source</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => handleOptionSelect('camera')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionIconBox, { backgroundColor: '#FFEDF2' }]}>
                                    <Text style={styles.optionEmoji}>📷</Text>
                                </View>
                                <View>
                                    <Text style={styles.optionLabel}>Take Photo</Text>
                                    <Text style={styles.optionSubLabel}>Use your camera to capture document</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => handleOptionSelect('gallery')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionIconBox, { backgroundColor: '#E8F1FE' }]}>
                                    <Text style={styles.optionEmoji}>🖼️</Text>
                                </View>
                                <View>
                                    <Text style={styles.optionLabel}>Choose from Gallery</Text>
                                    <Text style={styles.optionSubLabel}>Pick an existing image from phone</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowOptions(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableOpacity>
                </Modal>

                {/* ── Submit Button ── */}
                <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.submitBtn, (!imageUri || isSubmitting) && styles.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={!imageUri || isSubmitting}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.submitBtnText}>
                            {isSubmitting
                                ? ocrStatus === 'running'
                                    ? 'Scanning Document...'
                                    : 'Submitting...'
                                : 'Submit for Review'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.privacyNote}>
                        By submitting, you agree to our privacy policy regarding health data processing.
                    </Text>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1522' },
    safeArea: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backArrow: { color: '#FFFFFF', fontSize: 24, fontWeight: '600' },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

    sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
    chip: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#334155',
    },
    chipActive: {
        backgroundColor: '#3D8EFF',
        borderColor: '#3D8EFF',
    },
    chipText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: '#FFFFFF' },

    uploadArea: { marginBottom: 30 },
    uploadDashedBox: {
        backgroundColor: '#162032',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#334155',
        borderStyle: 'dashed',
    },
    uploadIcons: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: { fontSize: 24 },
    uploadTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 8 },
    uploadSubtitle: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    selectBtn: {
        backgroundColor: '#3D8EFF',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 50,
    },
    selectBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    previewContainer: {
        backgroundColor: '#162032',
        borderRadius: 24,
        height: 480,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    previewImage: { width: '100%', height: '100%' },
    previewPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    placeholderIcon: { fontSize: 60, opacity: 0.1, marginBottom: 20 },
    placeholderText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20, opacity: 0.6 },

    bottomBar: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#0D1522',
    },
    submitBtn: {
        backgroundColor: '#F06292',
        paddingVertical: 18,
        borderRadius: 50,
        alignItems: 'center',
        marginBottom: 16,
    },
    btnDisabled: { opacity: 0.5 },
    submitBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    privacyNote: { color: '#64748B', fontSize: 11, textAlign: 'center', lineHeight: 16 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#162032',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#334155',
        borderRadius: 2,
        marginBottom: 16,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    optionIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionEmoji: { fontSize: 20 },
    optionLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 2 },
    optionSubLabel: { color: '#94A3B8', fontSize: 12 },
    cancelBtn: {
        marginTop: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelBtnText: { color: '#F06292', fontSize: 16, fontWeight: '700' },
});
