import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ANCVisits() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [visits, setVisits] = React.useState<any[]>([]);

    React.useEffect(() => {
        async function loadVisits() {
            if (!phone) return;
            try {
                const requireDb = require('../../database/db').default;
                const rows: any[] = await requireDb.getAllAsync(
                    'SELECT * FROM anc_visits WHERE phone = ? ORDER BY visit_number ASC',
                    [phone]
                );
                setVisits(rows);
            } catch (e) {
                console.error('Load visits error:', e);
            }
        }
        loadVisits();
    }, [phone]);

    const formatVisitDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1522" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Your ANC Visits</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Timeline Container ── */}
                    <View style={styles.timelineContainer}>
                        {/* The Vertical Line */}
                        <View style={styles.verticalLine} />

                        {visits.map((v, idx) => (
                            <VisitStep
                                key={v.id}
                                type={v.status}
                                title={`Visit ${v.visit_number} - ${v.status.charAt(0).toUpperCase() + v.status.slice(1)}`}
                                date={formatVisitDate(v.scheduled_date)}
                                items={['Weight check', 'BP check', 'Hb test', 'Ultrasound']}
                                delay={idx * 100}
                                subtitle={v.status === 'not-scheduled' ? "Schedule after 28th week" : undefined}
                            />
                        ))}

                        {visits.length === 0 && (
                            <Text style={{ color: '#94A3B8', textAlign: 'center', marginTop: 40 }}>
                                No visits scheduled yet.
                            </Text>
                        )}
                    </View>

                    {/* ── ASHA Worker Card ── */}
                    <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.ashaCard}>
                        <View style={styles.ashaInfo}>
                            <View style={styles.ashaAvatar}>
                                <Text style={styles.ashaAvatarIcon}>👤</Text>
                            </View>
                            <View>
                                <Text style={styles.ashaLabel}>YOUR ASHA WORKER</Text>
                                <Text style={styles.ashaName}>Lakshmi Devi</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
                            <Text style={styles.callIcon}>📞</Text>
                            <Text style={styles.callText}>Call</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── Bottom Nav ── */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.replace({ pathname: '/dashboards/pregnancy', params: { phone: phone ?? '' } })}>
                        <Text style={styles.navIcon}>⌂</Text>
                        <Text style={styles.navText}>HOME</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} activeOpacity={1}>
                        <Text style={[styles.navIcon, styles.navIconActive]}>📅</Text>
                        <Text style={[styles.navText, styles.navTextActive]}>VISITS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>♥</Text>
                        <Text style={styles.navText}>HEALTH</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => router.push({
                            pathname: '/profile-setup/step1' as any,
                            params: { phone: phone ?? '' }
                        })}
                    >
                        <Text style={styles.navIcon}>👤</Text>
                        <Text style={styles.navText}>PROFILE</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

// ─── Visit Step Component ─────────────────────────────────────────────────────
function VisitStep({ type, title, date, subtitle, items, delay }: any) {
    const isCompleted = type === 'completed';
    const isUpcoming = type === 'upcoming';

    return (
        <Animated.View entering={FadeInDown.duration(500).delay(delay)} style={styles.stepRow}>
            {/* Marker */}
            <View style={styles.markerContainer}>
                <View style={[
                    styles.markerCircle,
                    isCompleted && styles.markerCompleted,
                    isUpcoming && styles.markerUpcoming,
                    type === 'not-scheduled' && styles.markerNotScheduled
                ]}>
                    {isCompleted && <Text style={styles.markerTick}>✓</Text>}
                    {isUpcoming && <Text style={styles.markerIcon}>📅</Text>}
                    {type === 'not-scheduled' && <Text style={styles.markerIcon}>🕒</Text>}
                </View>
            </View>

            {/* Card */}
            <View style={[
                styles.stepCard,
                isUpcoming && styles.upcomingCard,
                type === 'not-scheduled' && styles.notScheduledCard
            ]}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={[styles.cardTitle, type === 'not-scheduled' && styles.darkText]}>{title}</Text>
                        {date && <Text style={styles.cardDate}>{date}</Text>}
                        {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
                    </View>
                    {isCompleted && <Text style={styles.viewNotes}>View notes</Text>}
                    {isUpcoming && (
                        <TouchableOpacity style={styles.bookBtn}>
                            <Text style={styles.bookBtnText}>Book now</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {items && (
                    <View style={styles.itemsGrid}>
                        {items.map((item: string, idx: number) => (
                            <View key={idx} style={styles.checkItem}>
                                <View style={[styles.checkCircle, isCompleted && styles.checkCircleActive]}>
                                    {isCompleted && <Text style={styles.checkTick}>✓</Text>}
                                </View>
                                <Text style={[styles.checkLabel, type === 'not-scheduled' && styles.darkText]}>{item}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1522' },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backArrow: { color: '#FFFFFF', fontSize: 24 },
    headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

    timelineContainer: { paddingLeft: 10 },
    verticalLine: {
        position: 'absolute',
        top: 30,
        left: 30,
        bottom: 50,
        width: 2,
        backgroundColor: '#1E293B',
    },

    stepRow: { flexDirection: 'row', marginBottom: 30 },
    markerContainer: { width: 40, alignItems: 'center', marginRight: 16 },
    markerCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        borderWidth: 2,
        borderColor: '#0D1522',
    },
    markerCompleted: { backgroundColor: '#F06292' },
    markerUpcoming: { backgroundColor: '#162032', borderColor: '#F06292' },
    markerNotScheduled: { backgroundColor: '#162032', borderColor: '#334155' },
    markerTick: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
    markerIcon: { fontSize: 16 },

    stepCard: {
        flex: 1,
        backgroundColor: '#162032',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    upcomingCard: { borderColor: '#F06292', borderStyle: 'solid' },
    notScheduledCard: { borderStyle: 'dashed', opacity: 0.6 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 4 },
    cardDate: { color: '#F06292', fontSize: 14, fontWeight: '700' },
    cardSubtitle: { color: '#94A3B8', fontSize: 13 },
    viewNotes: { color: '#F06292', fontSize: 13, fontWeight: '700' },
    bookBtn: { backgroundColor: '#F06292', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    bookBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    darkText: { color: '#94A3B8' },

    itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%' },
    checkCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#334155', justifyContent: 'center', alignItems: 'center' },
    checkCircleActive: { backgroundColor: '#22C55E' + '33', borderColor: '#22C55E' },
    checkTick: { color: '#22C55E', fontSize: 10, fontWeight: '900' },
    checkLabel: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },

    ashaCard: {
        backgroundColor: '#162032',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    ashaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ashaAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3A202A', justifyContent: 'center', alignItems: 'center' },
    ashaAvatarIcon: { fontSize: 20 },
    ashaLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    ashaName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
    callBtn: { backgroundColor: '#0D9488', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
    callIcon: { fontSize: 16 },
    callText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        backgroundColor: '#0D1522',
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
    },
    navItem: { alignItems: 'center', gap: 4 },
    navIcon: { color: '#64748B', fontSize: 22 },
    navIconActive: { color: '#F06292' },
    navText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
    navTextActive: { color: '#F06292' },
});
