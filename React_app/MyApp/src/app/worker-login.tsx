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

export default function WorkerLoginScreen() {
    const router = useRouter();
    const [workerId, setWorkerId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleLogin = () => {
        if (!workerId.trim() || !password.trim()) {
            Alert.alert('Missing Fields', 'Please enter your Worker ID and password.');
            return;
        }
        setLoading(true);
        // Simulate auth
        setTimeout(() => {
            setLoading(false);
            // Navigate to health worker dashboard
            router.replace('/drug-recommendation' as any);
        }, 1200);
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
                            <Text style={styles.iconEmoji}>👩‍⚕️</Text>
                        </View>

                        <Text style={styles.title}>Health Worker Login</Text>
                        <Text style={styles.subtitle}>
                            Login with your ASHA / ANM / PHC Worker credentials
                        </Text>

                        <Animated.View entering={FadeInUp.duration(500)} style={styles.inputGroup}>
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
    backText: { color: '#00C9A7', fontSize: 16, fontWeight: '600' },
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
});
