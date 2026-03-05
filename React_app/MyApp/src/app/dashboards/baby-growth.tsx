import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import db from '../../database/db';

export default function BabyGrowth() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [weekData, setWeekData] = useState<any>(null);
    const [week, setWeek] = useState(24);

    useEffect(() => {
        async function loadGrowth() {
            if (!phone) return;
            try {
                // Get current week from pregnancy_records
                const preg: any = await db.getFirstAsync(
                    'SELECT edd FROM pregnancy_records WHERE phone = ?',
                    [phone]
                );
                if (preg && preg.edd) {
                    const { calculatePregnancyStats } = require('../../utils/pregnancy');
                    const stats = calculatePregnancyStats(preg.edd);
                    setWeek(stats.currentWeek);

                    // Fetch static data for this week (or fallback)
                    // For now using mock since we didn't seed yet
                    setWeekData({
                        size: stats.babySize,
                        weight: '600g',
                        length: '30cm',
                        development: 'Your baby can now hear your voice and heartbeats. The lungs are starting to produce surfactant.'
                    });
                }
            } catch (e) {
                console.error('Load growth error:', e);
            }
        }
        loadGrowth();
    }, [phone]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1522" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Baby Growth 👶</Text>
                    <View style={{ width: 40 }} />
                </View>

                {weekData ? (
                    <ScrollView contentContainerStyle={styles.content}>
                        <Animated.View entering={FadeInDown} style={styles.mainCard}>
                            <Text style={styles.weekLabel}>WEEK {week}</Text>
                            <Text style={styles.sizeTitle}>{weekData.size}</Text>
                            <Text style={styles.sizeSubtitle}>Size of baby</Text>

                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Weight</Text>
                                    <Text style={styles.statValue}>{weekData.weight}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Length</Text>
                                    <Text style={styles.statValue}>{weekData.length}</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200)} style={styles.devCard}>
                            <Text style={styles.devTitle}>Development Update</Text>
                            <Text style={styles.devText}>{weekData.development}</Text>
                        </Animated.View>

                    </ScrollView>
                ) : (
                    <View style={styles.loading}>
                        <Text style={{ color: '#FFF' }}>Loading...</Text>
                    </View>
                )}
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
    mainCard: {
        backgroundColor: '#162032',
        padding: 40,
        borderRadius: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
        marginBottom: 20
    },
    weekLabel: { color: '#F06292', fontSize: 16, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
    sizeTitle: { color: '#FFF', fontSize: 40, fontWeight: '900', marginBottom: 5 },
    sizeSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
    statsRow: { flexDirection: 'row', marginTop: 30, gap: 40 },
    statBox: { alignItems: 'center' },
    statLabel: { color: '#64748B', fontSize: 12, fontWeight: '700', marginBottom: 5 },
    statValue: { color: '#FFF', fontSize: 20, fontWeight: '800' },
    devCard: { backgroundColor: '#131D2D', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#1E293B' },
    devTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 12 },
    devText: { color: '#94A3B8', fontSize: 15, lineHeight: 24 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
