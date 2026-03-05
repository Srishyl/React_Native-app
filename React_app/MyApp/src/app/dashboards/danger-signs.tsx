import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Linking,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function DangerSigns() {
    const router = useRouter();

    const signs = [
        {
            icon: '!',
            iconBg: '#3F161C',
            iconColor: '#FF4D4D',
            title: 'Severe headache + blurred vision',
            subtitle: 'Could be pre-eclampsia',
            hasArrow: true
        },
        {
            icon: '*',
            iconBg: '#3F161C',
            iconColor: '#FF4D4D',
            title: 'Heavy bleeding',
            subtitle: 'Emergency - seek help immediately',
            hasArrow: true
        },
        {
            icon: '👶',
            iconBg: '#3F161C',
            iconColor: '#FF4D4D',
            title: 'Baby not moving for 12 hours',
            subtitle: 'Count kicks and monitor closely',
            hasArrow: true
        },
        {
            icon: '🌡️',
            iconBg: '#2A2510',
            iconColor: '#FFD700',
            title: 'High fever',
            subtitle: 'Visit Public Health Center (PHC)',
            hasArrow: true
        },
        {
            icon: '🖐️',
            iconBg: '#2A2510',
            iconColor: '#FFD700',
            title: 'Swollen hands/face',
            subtitle: 'Contact health worker',
            hasArrow: true
        }
    ];

    const handleCallASHA = () => Linking.openURL('tel:1234567890');
    const handleCallEmergency = () => Linking.openURL('tel:108');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#E91E63" />

            {/* Header */}
            <View style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <View style={styles.backCircle}>
                                <Text style={styles.backArrow}>←</Text>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Know Your Danger Signs 🚨</Text>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Alert Banner */}
                <Animated.View
                    entering={FadeInDown.duration(600)}
                    style={styles.alertBanner}
                >
                    <Text style={styles.bannerTitle}>Urgent Health Alerts</Text>
                    <View style={styles.warningIconPos}>
                        <Text style={styles.warningTriangle}>⚠️</Text>
                    </View>
                </Animated.View>

                {/* List of Signs */}
                <View style={styles.listContainer}>
                    {signs.map((sign, idx) => (
                        <Animated.View
                            key={idx}
                            entering={FadeInDown.delay(200 + (idx * 100)).duration(500)}
                            style={styles.signCard}
                        >
                            <View style={[styles.iconBox, { backgroundColor: sign.iconBg }]}>
                                <Text style={[styles.iconText, { color: sign.iconColor }]}>{sign.icon}</Text>
                            </View>
                            <View style={styles.signInfo}>
                                <Text style={styles.signTitle}>{sign.title}</Text>
                                <Text style={styles.signSubtitle}>{sign.subtitle}</Text>
                            </View>
                            {sign.hasArrow && <Text style={styles.arrow}>›</Text>}
                        </Animated.View>
                    ))}
                </View>

                {/* Spacing for buttons */}
                <View style={{ height: 160 }} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.ashaBtn}
                    onPress={handleCallASHA}
                    activeOpacity={0.8}
                >
                    <Text style={styles.btnIcon}>📞</Text>
                    <Text style={styles.btnText}>Call ASHA Worker</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.emergencyBtn}
                    onPress={handleCallEmergency}
                    activeOpacity={0.8}
                >
                    <Text style={styles.btnIcon}>📡</Text>
                    <Text style={styles.btnText}>Call 108 Emergency</Text>
                </TouchableOpacity>
                <SafeAreaView edges={['bottom']} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1522' },
    header: {
        backgroundColor: '#E91E63',
        paddingBottom: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    backBtn: { marginRight: 15 },
    backCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },

    scroll: { flex: 1 },
    scrollContent: { padding: 20 },

    alertBanner: {
        backgroundColor: '#D81B60',
        borderRadius: 30,
        height: 180,
        justifyContent: 'center',
        paddingLeft: 25,
        marginBottom: 25,
        position: 'relative',
        overflow: 'hidden',
    },
    bannerTitle: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
        width: '60%',
        lineHeight: 38,
    },
    warningIconPos: {
        position: 'absolute',
        right: -10,
        top: 20,
        opacity: 0.2,
    },
    warningTriangle: {
        fontSize: 140,
        color: '#FFF',
    },

    listContainer: { gap: 12 },
    signCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#162032',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconText: { fontSize: 22, fontWeight: 'bold' },
    signInfo: { flex: 1 },
    signTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700', marginBottom: 2 },
    signSubtitle: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
    arrow: { color: '#64748B', fontSize: 24, fontWeight: '300' },

    bottomBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#0D1522',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
    },
    ashaBtn: {
        flexDirection: 'row',
        backgroundColor: '#00A896',
        paddingVertical: 18,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    emergencyBtn: {
        flexDirection: 'row',
        backgroundColor: '#E91E63',
        paddingVertical: 18,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    btnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    btnIcon: { fontSize: 18 },
});
