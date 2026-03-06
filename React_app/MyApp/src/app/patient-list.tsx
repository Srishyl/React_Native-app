import React, { useState } from 'react';
import { Text, TextInput } from '@/components/AppText';
import { StyleSheet, View, TouchableOpacity, ScrollView, StatusBar, Platform, ActivityIndicator, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import db from '../database/db';

const FILTERS = ['All', 'Pregnant', 'High Risk', 'Not Visited 30d'];

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

export default function PatientListScreen() {
    const router = useRouter();
    const { workerName, workerRole, workerId, workerPincode, workerLat, workerLon } =
        useLocalSearchParams<{ workerName: string, workerRole: string, workerId: string, workerPincode: string, workerLat: string, workerLon: string }>();

    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [patients, setPatients] = useState<any[]>([]);
    const [detectingLoc, setDetectingLoc] = useState(false);
    const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);

    // useRef so the interval always gets the latest version of the fetch function
    // (fixes stale closure bug from empty dependency array)
    const fetchRef = React.useRef<(showErrorAlert?: boolean) => void>(() => { });

    const fetchNearbyPatients = async (showErrorAlert = false) => {
        setDetectingLoc(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (showErrorAlert) Alert.alert('Permission Denied', 'Location permission is required to detect nearby patients.');
                setDetectingLoc(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            // Use fresh GPS coords if available, fall back to params passed from login
            const lat = location.coords.latitude || (workerLat ? parseFloat(workerLat) : null);
            const lon = location.coords.longitude || (workerLon ? parseFloat(workerLon) : null);
            const wPincode = workerPincode ? workerPincode.trim() : '';

            const allPatients: any = await db.getAllAsync(
                'SELECT phone, full_name, age, gender, village, pincode, care_mode, latitude, longitude FROM patient_profiles'
            );

            const nearbyPatients = allPatients
                .map((p: any) => {
                    let matchedByGps = false;
                    let matchedByPincode = false;
                    let distanceKm: number | null = null;

                    // GPS match: within 5km
                    if (lat && lon && p.latitude && p.longitude) {
                        distanceKm = getDistanceFromLatLonInKm(lat, lon, p.latitude, p.longitude);
                        if (distanceKm <= 5) matchedByGps = true;
                    }

                    // Pincode match: same pincode string
                    if (wPincode && p.pincode && p.pincode.trim() === wPincode) {
                        matchedByPincode = true;
                    }

                    return { ...p, matchedByGps, matchedByPincode, distanceKm };
                })
                .filter((p: any) => p.matchedByGps || p.matchedByPincode)
                .map((p: any) => {
                    // Build a match label for the card
                    const matchReasons: string[] = [];
                    if (p.matchedByGps && p.distanceKm !== null)
                        matchReasons.push(`📍 ${p.distanceKm.toFixed(1)} km`);
                    if (p.matchedByPincode)
                        matchReasons.push(`📮 Pincode ${p.pincode}`);

                    return {
                        id: p.phone || Math.random().toString(),
                        name: p.full_name || 'Unknown',
                        statusLabel: p.care_mode === 'pregnancy' ? 'Pregnant' : 'Normal',
                        statusColor: p.care_mode === 'pregnancy' ? '#EF4444' : '#10B981',
                        statusBg: p.care_mode === 'pregnancy' ? '#FEE2E2' : '#D1FAE5',
                        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150',
                        indicators: [p.age ? `${p.age} years` : '', p.village ? `from ${p.village}` : ''],
                        matchLabel: matchReasons.join('  ·  '),
                        isHighRisk: p.care_mode === 'pregnancy',
                        condition: '',
                        metric: '',
                        action: ''
                    };
                });

            setPatients(nearbyPatients);
            if (nearbyPatients.length === 0 && showErrorAlert) {
                Alert.alert('No Patients Found', `No patients found within 5km or matching pincode "${wPincode}" of your location.`);
            }
        } catch (error) {
            console.error('Location detection failed:', error);
            if (showErrorAlert) Alert.alert('Error', 'Failed to detect location or fetch data.');
        } finally {
            setDetectingLoc(false);
        }
    };

    const handleDetectLocation = () => fetchNearbyPatients(true);

    // Keep the ref up-to-date on every render so the interval always calls
    // the freshest version (with the latest workerPincode / workerLat / workerLon)
    React.useEffect(() => {
        fetchRef.current = fetchNearbyPatients;
    });

    useFocusEffect(
        React.useCallback(() => {
            // Immediately fetch when the screen comes into focus
            fetchRef.current(false);

            // Poll every 5 seconds — new patient profiles will appear in near-realtime
            const interval = setInterval(() => {
                fetchRef.current(false);
            }, 5000);

            return () => clearInterval(interval);
        }, []) // empty deps is correct here because we use fetchRef
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>

                {/* Header */}
                <View style={styles.headerRow}>
                    <View style={{ flex: 1, alignItems: 'flex-start', marginLeft: -16 }}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                    </View>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setProfileMenuVisible(true)}>
                        <MaterialIcons name="account-circle" size={30} color="#0072E9" />
                    </TouchableOpacity>
                </View>

                {/* Profile Dropdown Menu */}
                <Modal visible={isProfileMenuVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProfileMenuVisible(false)}>
                        <View style={styles.profileMenu}>
                            <View style={styles.profileMenuHeader}>
                                <View style={styles.profileAvatar}>
                                    <MaterialIcons name="account-circle" size={48} color="#0072E9" />
                                </View>
                                <Text style={styles.profileName}>{workerName || 'Asha Worker'}</Text>
                                <Text style={styles.profileRole}>{workerRole || 'Worker'} • ID: {workerId || 'N/A'}</Text>
                            </View>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                                Alert.alert('Logout', 'Are you sure you want to logout?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Logout', style: 'destructive', onPress: () => { setProfileMenuVisible(false); router.replace('/' as any); } }
                                ]);
                            }}>
                                <MaterialIcons name="logout" size={22} color="#dc2626" />
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Top Nav (formerly Bottom Nav) */}
                <View style={styles.topNav}>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="people" size={26} color="#0072E9" />
                        <Text style={styles.navTextActive}>Patients</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="calendar-today" size={26} color="#6B7280" />
                        <Text style={styles.navText}>Visits</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="check-circle-outline" size={26} color="#6B7280" />
                        <Text style={styles.navText}>Tasks</Text>
                    </TouchableOpacity>
                </View>

                {/* Detect Location Banner */}
                <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 8 }}>
                    <TouchableOpacity
                        style={styles.detectBtn}
                        onPress={handleDetectLocation}
                        disabled={detectingLoc}
                        activeOpacity={0.8}
                    >
                        {detectingLoc ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <MaterialIcons name="my-location" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.detectText}>Detect Nearby Patients</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, ID or condition..."
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Filters */}
                <View style={styles.filtersWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                        {FILTERS.map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                                onPress={() => setActiveFilter(f)}
                            >
                                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                                    {f}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Patient List */}
                <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
                    {patients.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
                            <Text style={{ color: '#4b7a5b', fontSize: 16 }}>No patients loaded.</Text>
                            <Text style={{ color: '#4b7a5b', fontSize: 13, marginTop: 8, textAlign: 'center', opacity: 0.7 }}>Tap "Detect Nearby Patients" up top to fetch patients locally.</Text>
                        </View>
                    ) : (
                        patients.filter(p => {
                            if (activeFilter === 'All') return true;
                            if (activeFilter === 'Pregnant') return p.statusLabel === 'Pregnant';
                            if (activeFilter === 'High Risk') return p.isHighRisk;
                            if (activeFilter === 'Not Visited 30d') return true; // Stub for now
                            return true;
                        }).map((p) => (
                            <TouchableOpacity key={p.id} style={[styles.card, p.isHighRisk && styles.cardHighRisk]} activeOpacity={0.8}
                                onPress={() => router.push({ pathname: '/worker-patient-detail' as any, params: { phone: p.id } })}>
                                <View style={styles.cardAvatarContainer}>
                                    <View style={[styles.cardAvatar, p.isHighRisk && styles.cardAvatarHighRisk]}>
                                        <MaterialIcons name="person" size={32} color="#0072E9" />
                                    </View>
                                    <View style={[styles.statusDot, { backgroundColor: p.isHighRisk ? '#EF233C' : '#6BA259' }]} />
                                </View>

                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardName}>{p.name}</Text>
                                        <View style={[styles.badge, { backgroundColor: p.statusBg }]}>
                                            <Text style={[styles.badgeText, { color: p.statusColor }]}>{p.statusLabel}</Text>
                                        </View>
                                    </View>

                                    {/* Match reason row */}
                                    {p.matchLabel ? (
                                        <View style={styles.matchRow}>
                                            <Text style={styles.matchLabel}>{p.matchLabel}</Text>
                                        </View>
                                    ) : null}

                                    {p.condition ? (
                                        <View style={styles.conditionBlock}>
                                            <Text style={styles.conditionText}>{p.condition}</Text>
                                            <View style={styles.metricRow}>
                                                <View style={styles.metricBadge}>
                                                    <Text style={styles.metricText}>{p.metric}</Text>
                                                </View>
                                                <Text style={styles.actionText}>{p.action}</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.indicatorRow}>
                                            {p.indicators.map((ind: string, i: number) => ind !== '' && (
                                                <Text key={i} style={[styles.indicatorText, ind.includes('warning') && styles.indicatorWarning]}>
                                                    {ind.replace(' (warning)', '')}
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.chevron}>›</Text>
                            </TouchableOpacity>
                        ))
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* FAB */}
                <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
                    <MaterialIcons name="qr-code-scanner" size={26} color="#fff" />
                </TouchableOpacity>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    safeArea: { flex: 1 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    iconButton: { padding: 8 },
    headerLogo: { width: 200, height: 52 },

    // Profile Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', alignItems: 'flex-end' },
    profileMenu: {
        backgroundColor: '#FFFFFF', width: 260,
        marginTop: Platform.OS === 'ios' ? 100 : 70, marginRight: 16,
        borderRadius: 16, padding: 16,
        shadowColor: '#0072E9', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
    },
    profileMenuHeader: { alignItems: 'center', marginBottom: 16, marginTop: 4 },
    profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E9E9E9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    profileName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 2 },
    profileRole: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    menuDivider: { height: 1, backgroundColor: '#E9E9E9', marginBottom: 8 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#FEE2E2' },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#EF233C', marginLeft: 12 },

    detectBtn: {
        flexDirection: 'row',
        backgroundColor: '#0072E9',
        borderRadius: 14,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0072E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    detectIcon: { fontSize: 18, marginRight: 8 },
    detectText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    avatar: {
        width: 36, height: 36, borderRadius: 18,
        borderWidth: 2, borderColor: '#0072E9', marginLeft: 12,
        backgroundColor: '#E9E9E9',
        justifyContent: 'center', alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16, marginTop: 8,
        borderRadius: 14, paddingHorizontal: 12,
        borderWidth: 1.5, borderColor: '#E9E9E9',
    },
    searchIcon: { fontSize: 18, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' },
    filtersWrapper: { marginTop: 16, marginBottom: 8 },
    filtersContainer: { paddingHorizontal: 16, gap: 8 },
    filterChip: {
        paddingHorizontal: 20, paddingVertical: 8,
        borderRadius: 20, backgroundColor: '#FFFFFF',
        borderWidth: 1.5, borderColor: '#E9E9E9', marginRight: 8,
    },
    filterChipActive: { backgroundColor: '#0072E9', borderColor: '#0072E9' },
    filterText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    filterTextActive: { color: '#FFFFFF' },
    listContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 12 },
    card: {
        flexDirection: 'row', backgroundColor: '#FFFFFF',
        borderRadius: 18, padding: 16, alignItems: 'center',
        borderWidth: 1.5, borderColor: '#E9E9E9',
        shadowColor: '#0072E9', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 6, elevation: 2, marginBottom: 12,
    },
    cardHighRisk: { borderLeftWidth: 4, borderLeftColor: '#EF233C' },
    cardAvatarContainer: { position: 'relative', marginRight: 16 },
    cardAvatar: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: '#E9E9E9',
        justifyContent: 'center', alignItems: 'center',
    },
    cardAvatarHighRisk: { borderWidth: 2, borderColor: 'rgba(239, 35, 60, 0.3)' },
    statusDot: {
        position: 'absolute', bottom: -2, right: -2,
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 2, borderColor: '#FFFFFF',
    },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    cardName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    indicatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
    indicatorText: { fontSize: 13, color: '#6B7280' },
    indicatorWarning: { color: '#EF233C', fontWeight: '500' },
    chevron: { fontSize: 24, color: '#0072E9', marginLeft: 8 },
    conditionBlock: { marginTop: 4 },
    conditionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
    metricRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 },
    metricBadge: { backgroundColor: '#E9E9E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    metricText: {
        fontSize: 13, color: '#0072E9',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    actionText: { fontSize: 13, color: '#6B7280' },
    fab: {
        position: 'absolute', bottom: 24, right: 24,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#0072E9', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#0072E9', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
    },
    topNav: {
        flexDirection: 'row', justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderBottomWidth: 1.5, borderBottomColor: '#E9E9E9',
        shadowColor: '#0072E9', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    },
    navItem: { alignItems: 'center' },
    navIcon: { fontSize: 24, color: '#6B7280', marginBottom: 4 },
    navIconActive: { fontSize: 24, color: '#0072E9', marginBottom: 4 },
    navText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#6B7280' },
    navTextActive: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#0072E9' },
    matchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2 },
    matchLabel: { fontSize: 11, color: '#0072E9', fontWeight: '700' },
});
