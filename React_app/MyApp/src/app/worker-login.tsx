import React, { useState } from 'react';
import { Text, TextInput } from '@/components/AppText';

import { View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { MOCK_DOCTORS } from '../data/mock_doctors';

const VALID_WORKERS = [
    { id: 'WORKER01', pass: 'pass123' },
    { id: 'WORKER02', pass: 'pass123' },
    { id: 'WORKER03', pass: 'pass123' },
    { id: 'WORKER04', pass: 'pass123' },
    { id: 'WORKER05', pass: 'pass123' },
    { id: 'WORKER06', pass: 'pass123' },
    { id: 'WORKER07', pass: 'pass123' },
    { id: 'WORKER08', pass: 'pass123' },
    { id: 'WORKER09', pass: 'pass123' },
    { id: 'WORKER10', pass: 'pass123' },
];

export default function WorkerLoginScreen() {
    const router = useRouter();
    const [workerId, setWorkerId] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async () => {
        setErrorMsg('');
        if (!name.trim()) {
            setErrorMsg('Please enter your name.');
            return;
        }
        if (!role) {
            setErrorMsg('Please select your role.');
            return;
        }
        if (!workerId.trim() || !password.trim()) {
            setErrorMsg('Please enter your Worker ID and password.');
            return;
        }

        if (role === 'Doctor') {
            // Check against MOCK_DOCTORS. For mock simplicity, accept any matching doctor by ID and 'pass123'. 
            // In a real app we'd also check names strictly.
            const doctor = MOCK_DOCTORS.find(d => d.id.toLowerCase() === workerId.trim().toLowerCase());

            if (!doctor || password !== 'pass123') {
                setErrorMsg('Invalid Doctor ID or password (try pass123).');
                return;
            }

            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                router.replace({
                    pathname: '/doctor-dashboard' as any,
                    params: {
                        docId: doctor.id,
                        docName: doctor.name
                    }
                });
            }, 600);
            return;
        }

        const isValid = VALID_WORKERS.some(
            w => w.id === workerId.trim().toUpperCase() && w.pass === password
        );

        if (!isValid) {
            setErrorMsg('Invalid Worker ID or password.');
            return;
        }

        setLoading(true);

        // Detect worker's location and get their pincode via reverse geocoding
        let workerPincode = '';
        let workerLat = '';
        let workerLon = '';
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                workerLat = String(loc.coords.latitude);
                workerLon = String(loc.coords.longitude);

                const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
                if (MAPBOX_API_KEY) {
                    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${loc.coords.longitude},${loc.coords.latitude}.json?access_token=${MAPBOX_API_KEY}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (data?.features) {
                        const postcodeFeature = data.features.find((f: any) => f.place_type.includes('postcode'));
                        if (postcodeFeature) {
                            workerPincode = postcodeFeature.text;
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Worker location detection failed:', e);
        }

        setLoading(false);
        // Navigate to health worker dashboard with location params
        router.replace({
            pathname: '/patient-list' as any,
            params: {
                workerName: name.trim(),
                workerRole: role,
                workerId: workerId.trim().toUpperCase(),
                workerPincode,
                workerLat,
                workerLon,
            }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    style={styles.kav}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <Animated.ScrollView
                        entering={FadeInDown.duration(600)}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Icon */}
                        <View style={styles.iconWrapper}>
                            <Text style={styles.iconEmoji}>🩺</Text>
                        </View>

                        <Text style={styles.title}>Health Worker Login</Text>
                        <Text style={styles.subtitle}>
                            Login with your Doctor, ASHA, ANM, or PHC credentials
                        </Text>

                        {errorMsg ? (
                            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            </Animated.View>
                        ) : null}

                        <Animated.View entering={FadeInUp.duration(500)} style={styles.inputGroup}>
                            {/* Name */}
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your name"
                                placeholderTextColor="#4A6280"
                                value={name}
                                onChangeText={setName}
                            />

                            {/* Role */}
                            <Text style={styles.label}>Role</Text>
                            <View style={styles.roleContainer}>
                                {['Doctor', 'ASHA', 'PHC Worker', 'ANM', 'Others'].map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.roleChip, role === r && styles.roleChipActive]}
                                        onPress={() => setRole(r)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                                            {r}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Worker / Doctor ID */}
                            <Text style={styles.label}>{role === 'Doctor' ? 'Doctor ID' : 'Worker ID'}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={role === 'Doctor' ? "e.g. doc1" : "e.g. ASHA-KA-00123"}
                                placeholderTextColor="#4A6280"
                                value={workerId}
                                autoCapitalize="none"
                                onChangeText={setWorkerId}
                            />

                            {/* Password */}
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.passwordRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Enter password"
                                    placeholderTextColor="#4A6280"
                                    secureTextEntry={!showPass}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeBtn}
                                    onPress={() => setShowPass((v) => !v)}
                                >
                                    <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={22} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Login</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.forgotBtn}>
                                <Text style={styles.forgotText}>Forgot password? Contact your PHC supervisor</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    safeArea: { flex: 1 },
    kav: { flex: 1 },
    backBtn: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
    backText: { color: '#0072E9', fontSize: 16, fontWeight: '600' },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 50,
        alignItems: 'center',
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 22,
        backgroundColor: '#E9E9E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#0072E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 14,
        elevation: 6,
    },
    iconEmoji: { fontSize: 38 },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 36,
        paddingHorizontal: 8,
    },
    inputGroup: { width: '100%', gap: 12 },
    label: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: -4 },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 16,
        color: '#111827',
        fontSize: 16,
        fontWeight: '500',
        borderWidth: 1.5,
        borderColor: '#E9E9E9',
    },
    passwordRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    eyeBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E9E9E9',
    },
    eyeText: { fontSize: 18 },
    primaryBtn: {
        width: '100%',
        backgroundColor: '#0072E9',
        paddingVertical: 18,
        borderRadius: 50,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#0072E9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    forgotBtn: { alignItems: 'center', marginTop: 10 },
    forgotText: { color: '#0072E9', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    errorBox: {
        backgroundColor: 'rgba(239, 35, 60, 0.08)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 35, 60, 0.3)',
        marginBottom: 20,
        width: '100%',
    },
    errorText: {
        color: '#EF233C',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    roleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    roleChip: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E9E9E9',
    },
    roleChipActive: {
        backgroundColor: '#0072E9',
        borderColor: '#0072E9',
    },
    roleChipText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
    },
    roleChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
