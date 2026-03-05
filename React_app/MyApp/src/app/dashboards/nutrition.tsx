import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Nutrition() {
    const router = useRouter();
    const foods = [
        { emoji: '🥛', title: 'Calcium', desc: 'Milk, Curd, Cheese for strong bones.' },
        { emoji: '🥩', title: 'Iron', desc: 'Spinach, Meat, Beans for blood health.' },
        { emoji: '🥜', title: 'Protein', desc: 'Eggs, Pulses, Nuts for baby growth.' },
        { emoji: '🍊', title: 'Vitamin C', desc: 'Oranges, Lemons to help iron absorption.' },
        { emoji: '💧', title: 'Hydration', desc: 'Drink 8-10 glasses of water daily.' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1522" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nutrition 🍏</Text>
                    <div style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.summary}>Eating a balanced diet helps your baby develop and gives you energy.</Text>

                    {foods.map((food, idx) => (
                        <Animated.View
                            key={idx}
                            entering={FadeInDown.delay(idx * 100)}
                            style={styles.card}
                        >
                            <View style={styles.iconBox}>
                                <Text style={styles.emoji}>{food.emoji}</Text>
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.cardTitle}>{food.title}</Text>
                                <Text style={styles.cardDesc}>{food.desc}</Text>
                            </View>
                        </Animated.View>
                    ))}
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
    summary: { color: '#94A3B8', fontSize: 16, marginBottom: 24, textAlign: 'center', lineHeight: 24 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#162032',
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B'
    },
    iconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    emoji: { fontSize: 24 },
    info: { flex: 1 },
    cardTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
    cardDesc: { color: '#94A3B8', fontSize: 14, lineHeight: 20 },
});
