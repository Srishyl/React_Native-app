import React, { useState } from 'react';
import { Text, TextInput } from '@/components/AppText';

import { View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

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
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
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
                            Login with your ASHA / ANM / PHC Worker credentials
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
                                {['ASHA', 'PHC Worker', 'ANM', 'Others'].map(r => (
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

                            {/* Worker ID */}
                            <Text style={styles.label}>Worker ID</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. ASHA-KA-00123"
                                placeholderTextColor="#4A6280"
                                value={workerId}
                                onChangeText={setWorkerId}
                                autoCapitalize="characters"
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
                                    <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
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
    container: { flex: 1, backgroundColor: '#0D1B2E' },
    safeArea: { flex: 1 },
    kav: { flex: 1 },
    backBtn: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
    backText: { color: '#00C9A7', fontSize: 16, fontWeight: '600' },
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
        backgroundColor: '#0D3030',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#00C9A7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    iconEmoji: { fontSize: 38 },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#9BB4D0',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 36,
        paddingHorizontal: 8,
    },
    inputGroup: { width: '100%', gap: 12 },
    label: { color: '#9BB4D0', fontSize: 13, fontWeight: '600', marginBottom: -4 },
    input: {
        backgroundColor: '#1A3A5C',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 16,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    passwordRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    eyeBtn: {
        backgroundColor: '#1A3A5C',
        borderRadius: 14,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eyeText: { fontSize: 18 },
    primaryBtn: {
        width: '100%',
        backgroundColor: '#00C9A7',
        paddingVertical: 18,
        borderRadius: 50,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#00C9A7',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    forgotBtn: { alignItems: 'center', marginTop: 10 },
    forgotText: { color: '#4FC3F7', fontSize: 13, fontWeight: '500', textAlign: 'center' },
    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        marginBottom: 20,
        width: '100%',
    },
    errorText: {
        color: '#EF4444',
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
        backgroundColor: '#1A3A5C',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    roleChipActive: {
        backgroundColor: '#0D3030',
        borderColor: '#00C9A7',
    },
    roleChipText: {
        color: '#9BB4D0',
        fontSize: 14,
        fontWeight: '500',
    },
    roleChipTextActive: {
        color: '#00C9A7',
        fontWeight: '700',
    },
});
