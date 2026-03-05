import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import db from '../database/db';

type Step = 'phone' | 'otp';

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function PatientLoginScreen() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (phone.trim().length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
            return;
        }
        setLoading(true);
        try {
            const newOtp = generateOTP();
            setGeneratedOtp(newOtp);
            // Store pending OTP session in DB
            await db.runAsync(
                `INSERT OR REPLACE INTO patient_sessions (phone, otp, created_at) VALUES (?, ?, ?)`,
                [phone.trim(), newOtp, new Date().toISOString()]
            );
            // In production this would be sent via SMS
            Alert.alert('OTP Sent', `Your OTP is: ${newOtp}\n(Demo mode — shown here for testing)`, [
                { text: 'OK', onPress: () => setStep('otp') },
            ]);
        } catch (e) {
            // Table may not exist yet; create it and retry
            try {
                await db.execAsync(`
          CREATE TABLE IF NOT EXISTS patient_sessions (
            phone TEXT PRIMARY KEY NOT NULL,
            otp TEXT NOT NULL,
            created_at TEXT NOT NULL
          );
        `);
                const newOtp = generateOTP();
                setGeneratedOtp(newOtp);
                await db.runAsync(
                    `INSERT OR REPLACE INTO patient_sessions (phone, otp, created_at) VALUES (?, ?, ?)`,
                    [phone.trim(), newOtp, new Date().toISOString()]
                );
                Alert.alert('OTP Sent', `Your OTP is: ${newOtp}\n(Demo mode)`, [
                    { text: 'OK', onPress: () => setStep('otp') },
                ]);
            } catch (err) {
                Alert.alert('Error', 'Could not send OTP. Please try again.');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.trim().length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
            return;
        }
        setLoading(true);
        try {
            if (otp.trim() === generatedOtp) {
                // OTP verified — navigate to 3-step profile setup
                router.replace({
                    pathname: '/profile-setup/step1' as any,
                    params: { phone: phone.trim() },
                });
            } else {
                Alert.alert('Wrong OTP', 'The OTP you entered is incorrect. Please try again.');
            }
        } finally {
            setLoading(false);
        }
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

                    <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
                        {/* Icon */}
                        <View style={styles.iconWrapper}>
                            <Text style={styles.iconEmoji}>👤</Text>
                        </View>

                        <Text style={styles.title}>
                            {step === 'phone' ? 'Patient Login' : 'Verify OTP'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 'phone'
                                ? 'Enter your mobile number to receive a one-time password'
                                : `We sent a 6-digit OTP to +91 ${phone}`}
                        </Text>

                        {/* Phone Input */}
                        {step === 'phone' && (
                            <Animated.View entering={FadeInUp.duration(500)} style={styles.inputGroup}>
                                <Text style={styles.label}>Mobile Number</Text>
                                <View style={styles.phoneRow}>
                                    <View style={styles.countryCode}>
                                        <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="98765 43210"
                                        placeholderTextColor="#4A6280"
                                        keyboardType="phone-pad"
                                        value={phone}
                                        onChangeText={setPhone}
                                        maxLength={10}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                                    onPress={handleSendOtp}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryBtnText}>Send OTP</Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* OTP Input */}
                        {step === 'otp' && (
                            <Animated.View entering={FadeInUp.duration(500)} style={styles.inputGroup}>
                                <Text style={styles.label}>Enter OTP</Text>
                                <TextInput
                                    style={[styles.input, styles.otpInput]}
                                    placeholder="• • • • • •"
                                    placeholderTextColor="#4A6280"
                                    keyboardType="number-pad"
                                    value={otp}
                                    onChangeText={setOtp}
                                    maxLength={6}
                                    textAlign="center"
                                />

                                <TouchableOpacity
                                    style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                                    onPress={handleVerifyOtp}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.resendBtn}
                                    onPress={() => {
                                        setOtp('');
                                        setStep('phone');
                                    }}
                                >
                                    <Text style={styles.resendText}>Didn't receive? Change number</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </Animated.View>
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
    backText: { color: '#4FC3F7', fontSize: 16, fontWeight: '600' },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
        alignItems: 'center',
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 22,
        backgroundColor: '#1A3A5C',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#3D8EFF',
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
    phoneRow: { flexDirection: 'row', gap: 10 },
    countryCode: {
        backgroundColor: '#1A3A5C',
        borderRadius: 14,
        paddingHorizontal: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countryCodeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    input: {
        flex: 1,
        backgroundColor: '#1A3A5C',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 16,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    otpInput: {
        flex: 0,
        width: '100%',
        fontSize: 24,
        letterSpacing: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    primaryBtn: {
        width: '100%',
        backgroundColor: '#3D8EFF',
        paddingVertical: 18,
        borderRadius: 50,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#3D8EFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    resendBtn: { alignItems: 'center', marginTop: 12 },
    resendText: { color: '#4FC3F7', fontSize: 14, fontWeight: '600' },
});
