import React, { useState } from 'react';
import { Text, TextInput } from '@/components/AppText';

import {
    View,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as Location from 'expo-location'; // Added Location import
import db from '../../database/db';

const GENDERS = ['Male', 'Female', 'Other'] as const;
type Gender = typeof GENDERS[number];

const LANGUAGES = [
    { code: 'en', flag: '🇺🇸', label: 'English' },
    { code: 'kn', flag: '🇮🇳', label: 'Kannada' },
    { code: 'hi', flag: '🇮🇳', label: 'Hindi' },
    { code: 'ta', flag: '🇮🇳', label: 'Tamil' },
];

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
    const pct = (step / total) * 100;
    return (
        <View style={pb.wrapper}>
            <View style={pb.track}>
                <View style={[pb.fill, { width: `${pct}% ` as any }]} />
            </View>
        </View>
    );
}
const pb = StyleSheet.create({
    wrapper: { marginTop: 4 },
    track: {
        height: 4,
        backgroundColor: '#1E3A5A',
        borderRadius: 2,
        overflow: 'hidden',
    },
    fill: {
        height: 4,
        backgroundColor: '#3D8EFF',
        borderRadius: 2,
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Step1Screen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();

    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<Gender>('Male');
    const [village, setVillage] = useState('');
    const [pincode, setPincode] = useState('');
    const [language, setLanguage] = useState<string | null>(null); // Changed type and initial value
    const [saving, setSaving] = useState(false);
    const [detectingLoc, setDetectingLoc] = useState(false); // Added detectingLoc state
    const [latitude, setLatitude] = useState<number | null>(null); // Added latitude state
    const [longitude, setLongitude] = useState<number | null>(null); // Added longitude state

    const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY; // Added Mapbox API key

    // Silently grab location coordinates in the background when the user opens Step 1
    // to guarantee that lat/lon are not null in the database.
    React.useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    setLatitude(location.coords.latitude);
                    setLongitude(location.coords.longitude);
                }
            } catch (err) {
                console.log('Background location fetch failed', err);
            }
        })();
    }, []);

    const handleDetectLocation = async () => {
        setDetectingLoc(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to detect your city.');
                setDetectingLoc(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const lat = location.coords.latitude;
            const lon = location.coords.longitude;
            setLatitude(lat);
            setLongitude(lon);

            if (!MAPBOX_API_KEY) {
                Alert.alert('Configuration Error', 'Mapbox API key is missing.');
                return;
            }

            // Reverse Geocoding using Mapbox v5
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.features && data.features.length > 0) {
                // Try to extract a locality or place name
                const place = data.features.find((f: any) => f.place_type.includes('locality') || f.place_type.includes('place'));
                const postcode = data.features.find((f: any) => f.place_type.includes('postcode'));

                if (place) {
                    setVillage(place.text);
                } else {
                    // Fallback to the first feature's text
                    setVillage(data.features[0].text);
                }

                if (postcode) {
                    setPincode(postcode.text);
                }
            } else {
                Alert.alert('Location Not Found', 'Could not determine your city from coordinates.');
            }
        } catch (error) {
            console.error('Location detection failed:', error);
            Alert.alert('Error', 'Failed to detect location. Please try again.');
        } finally {
            setDetectingLoc(false);
        }
    };

    const handleNext = async () => {
        if (!fullName.trim()) {
            Alert.alert('Required', 'Please enter your full name.');
            return;
        }
        if (!age.trim() || isNaN(Number(age))) {
            Alert.alert('Required', 'Please enter a valid age.');
            return;
        }

        // If coordinates are still missing somehow, prompt the user.
        if (latitude === null || longitude === null) {
            Alert.alert(
                'Location Required',
                'Your location is needed for Asha Workers to find you. Please wait a moment while we get your location or tap "Detect".'
            );
            return;
        }

        setSaving(true);
        try {
            const now = new Date().toISOString();
            await db.runAsync(
                `INSERT INTO patient_profiles
          (phone, full_name, age, gender, village, pincode, language_preference, latitude, longitude, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(phone) DO UPDATE SET
          full_name = excluded.full_name,
          age = excluded.age,
          gender = excluded.gender,
          village = excluded.village,
          pincode = excluded.pincode,
          language_preference = excluded.language_preference,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          updated_at = excluded.updated_at`,
                [
                    phone ?? '',
                    fullName.trim(),
                    age.trim(),
                    gender,
                    village.trim(),
                    pincode.trim(),
                    language,
                    latitude,
                    longitude,
                    now,
                    now,
                ]
            );
            router.push({
                pathname: '/profile-setup/step2' as any,
                params: { phone: phone ?? '' },
            });
        } catch (err) {
            console.error('Step1 save error:', err);
            Alert.alert('Error', 'Could not save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                {/* ── Top Header ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <Text style={styles.headerTitle}>Profile Setup</Text>
                </Animated.View>

                {/* ── Step Label + Progress ── */}
                <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.stepRow}>
                    <Text style={styles.stepLabel}>Basic Information</Text>
                    <Text style={styles.stepCount}>Step 1 of 3</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.progressWrap}>
                    <ProgressBar step={1} total={3} />
                </Animated.View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Doctor Illustration ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.illustrationRow}>
                        <View style={styles.illustrationCard}>
                            <Image
                                source={require('../../../assets/doctor_profile.png')}
                                style={styles.illustrationImg}
                                contentFit="contain"
                            />
                        </View>
                    </Animated.View>

                    {/* ── Title ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                        <Text style={styles.title}>Tell us about yourself</Text>
                        <Text style={styles.subtitle}>
                            This helps us provide better care tailored to your needs.
                        </Text>
                    </Animated.View>

                    {/* ── Full Name ── */}
                    <Animated.View entering={FadeInUp.duration(400).delay(250)} style={styles.fieldBlock}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Rahul Sharma"
                            placeholderTextColor="#4A6280"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </Animated.View>

                    {/* ── Age ── */}
                    <Animated.View entering={FadeInUp.duration(400).delay(290)} style={styles.fieldBlock}>
                        <Text style={styles.label}>Age</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Years"
                            placeholderTextColor="#4A6280"
                            keyboardType="numeric"
                            value={age}
                            onChangeText={setAge}
                            maxLength={3}
                        />
                    </Animated.View>

                    {/* ── Gender ── */}
                    <Animated.View entering={FadeInUp.duration(400).delay(320)} style={styles.fieldBlock}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.genderRow}>
                            {GENDERS.map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.genderBtn,
                                        gender === g && styles.genderBtnActive,
                                    ]}
                                    onPress={() => setGender(g)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.genderText,
                                            gender === g && styles.genderTextActive,
                                        ]}
                                    >
                                        {g}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>

                    {/* ── Village / Pincode ── */}
                    <Animated.View
                        entering={FadeInUp.duration(400).delay(350)}
                        style={[styles.fieldBlock, styles.rowFields]}
                    >
                        <View style={styles.halfField}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={[styles.label, { marginBottom: 0 }]}>Village / Area</Text>
                                <TouchableOpacity onPress={handleDetectLocation} disabled={detectingLoc}>
                                    {detectingLoc ? (
                                        <ActivityIndicator size="small" color="#3D8EFF" />
                                    ) : (
                                        <Text style={{ fontSize: 12, color: '#3D8EFF', fontWeight: '700' }}>📍 Detect</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Location"
                                placeholderTextColor="#4A6280"
                                value={village}
                                onChangeText={setVillage}
                            />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Pincode</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="6-digits"
                                placeholderTextColor="#4A6280"
                                keyboardType="numeric"
                                value={pincode}
                                onChangeText={setPincode}
                                maxLength={6}
                            />
                        </View>
                    </Animated.View>

                    {/* ── Language Preference ── */}
                    <Animated.View entering={FadeInUp.duration(400).delay(380)} style={styles.fieldBlock}>
                        <Text style={styles.label}>Language Preference</Text>
                        <View style={styles.langGrid}>
                            {LANGUAGES.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.langChip,
                                        language === lang.code && styles.langChipActive,
                                    ]}
                                    onPress={() => setLanguage(lang.code)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.langFlag}>{lang.flag}</Text>
                                    <Text
                                        style={[
                                            styles.langText,
                                            language === lang.code && styles.langTextActive,
                                        ]}
                                    >
                                        {lang.label}
                                    </Text>
                                    {language === lang.code && (
                                        <Text style={styles.checkmark}> ✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── Next Button (fixed bottom) ── */}
                <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
                        onPress={handleNext}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.nextBtnText}>Next  →</Text>
                    </TouchableOpacity>
                </Animated.View>

            </SafeAreaView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1B2E' },
    safeArea: { flex: 1 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    skipBtn: { paddingHorizontal: 4, paddingVertical: 4 },
    skipText: { fontSize: 15, color: '#9BB4D0', fontWeight: '500' },

    stepRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 6,
    },
    stepLabel: { fontSize: 14, color: '#3D8EFF', fontWeight: '600' },
    stepCount: { fontSize: 14, color: '#9BB4D0', fontWeight: '500' },
    progressWrap: { paddingHorizontal: 24, marginBottom: 4 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 8 },

    illustrationRow: { alignItems: 'flex-end', marginBottom: 8 },
    illustrationCard: {
        width: 100,
        height: 110,
        backgroundColor: '#E8F5F4',
        borderRadius: 18,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustrationImg: { width: 90, height: 100 },

    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 14,
        color: '#9BB4D0',
        lineHeight: 21,
        marginBottom: 20,
    },

    fieldBlock: { marginBottom: 20 },
    rowFields: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1 },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#C8D8EA',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#132236',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: Platform.OS === 'ios' ? 16 : 13,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '400',
        borderWidth: 1,
        borderColor: '#1E3A5A',
    },

    genderRow: {
        flexDirection: 'row',
        backgroundColor: '#132236',
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: '#1E3A5A',
    },
    genderBtn: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
    },
    genderBtnActive: { backgroundColor: '#3D8EFF' },
    genderText: { color: '#9BB4D0', fontSize: 14, fontWeight: '600' },
    genderTextActive: { color: '#FFFFFF' },

    langGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    langChip: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '47%',
        backgroundColor: '#132236',
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderColor: '#1E3A5A',
    },
    langChipActive: { borderColor: '#3D8EFF' },
    langFlag: { fontSize: 16, marginRight: 6 },
    langText: { fontSize: 14, color: '#9BB4D0', fontWeight: '500' },
    langTextActive: { color: '#FFFFFF', fontWeight: '600' },
    checkmark: { fontSize: 14, color: '#3D8EFF', fontWeight: '800' },

    bottomBar: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 8 : 16,
        paddingTop: 12,
        backgroundColor: '#0D1B2E',
    },
    nextBtn: {
        backgroundColor: '#3D8EFF',
        paddingVertical: 18,
        borderRadius: 50,
        alignItems: 'center',
        shadowColor: '#3D8EFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 8,
    },
    nextBtnDisabled: { opacity: 0.6 },
    nextBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
