import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function DangerSigns() {
    const router = useRouter();
    const signs = [
        { emoji: '🩸', title: 'Vaginal Bleeding', desc: 'Any amount of bleeding during pregnancy.' },
        { emoji: '🤕', title: 'Severe Headache', desc: 'Blurring of vision or severe persistent headache.' },
        { emoji: '🤰', title: 'Abdominal Pain', desc: 'Severe pain in the stomach area.' },
        { emoji: '🦶', title: 'Swelling', desc: 'Sudden swelling of hands, face, or feet.' },
        { emoji: '🤮', title: 'Excessive Vomiting', desc: 'Unable to keep any food or water down.' },
        { emoji: '🚫', title: 'Reduced Movement', desc: 'Baby moving less than usual.' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1522" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Danger Signs ⚠️</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.warningText}>If you experience any of these symptoms, contact your ASHA worker or doctor immediately.</Text>

                    {signs.map((sign, idx) => (
                        <Animated.View
                            key={idx}
                            entering={FadeInDown.delay(idx * 100)}
                            style={styles.card}
                        >
                            <Text style={styles.emoji}>{sign.emoji}</Text>
                            <View style={styles.info}>
                                <Text style={styles.cardTitle}>{sign.title}</Text>
                                <Text style={styles.cardDesc}>{sign.desc}</Text>
                            </View>
                        </Animated.View>
                    ))}

                    <TouchableOpacity style={styles.emergencyBtn}>
                        <Text style={styles.emergencyText}>Call Emergency: 108</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1522' },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    backBtn: { width: 40 },
    backArrow: { color: '#FFF', fontSize: 24 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
    content: { padding: 20 },
    warningText: { color: '#94A3B8', fontSize: 16, marginBottom: 24, textAlign: 'center', lineHeight: 24 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#162032',
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B'
    },
    emoji: { fontSize: 32, marginRight: 20 },
    info: { flex: 1 },
    cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
    cardDesc: { color: '#94A3B8', fontSize: 14, lineHeight: 20 },
    emergencyBtn: {
        backgroundColor: '#EF4444',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20
    },
    emergencyText: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});
