import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StatusBar,
    Linking,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import db from '../database/db';

const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

export default function FindPHCScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState<string>('');
    const [facilities, setFacilities] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);

    const handleDetectLocation = async () => {
        if (!MAPBOX_API_KEY || MAPBOX_API_KEY.includes('your_mapbox_api_key_here')) {
            Alert.alert('Configuration Error', 'Mapbox API key is missing. Please add it to the .env file and restart the Expo app.');
            return;
        }

        setLoading(true);
        setSearched(true);
        setLocationStatus('Requesting location access...');

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Please enable location services in your phone settings to find nearby centers.'
                );
                setLoading(false);
                setLocationStatus('Permission denied.');
                return;
            }

            setLocationStatus('Detecting your coordinates...');
            // High accuracy is better for pinpointing the exact location
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = location.coords;

            // Save these coordinates back to the user's profile in the database
            if (phone) {
                try {
                    await db.runAsync(
                        'UPDATE patient_profiles SET latitude = ?, longitude = ? WHERE phone = ?',
                        [latitude, longitude, phone]
                    );
                    console.log('Successfully saved coordinates to DB for:', phone);
                } catch (dbError) {
                    console.error('Failed to save coordinates to DB:', dbError);
                }
            }

            setLocationStatus(`Detected Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}\nSearching for centers within ~10km...`);

            // The bounding box for Tamil Nadu, India roughly:
            // [minLng, minLat, maxLng, maxLat] -> [76.2415, 8.0772, 80.3468, 13.5134]
            const bbox = '76.2415,8.0772,80.3468,13.5134';

            // Mapbox Geocoding API: Restrict search strictly inside the Tamil Nadu bounding box
            const query = encodeURIComponent('hospital');
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?proximity=${longitude},${latitude}&bbox=${bbox}&country=IN&limit=4&access_token=${MAPBOX_API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data && data.features) {
                setFacilities(data.features);
                setLocationStatus(`Found ${data.features.length} facilities nearby.`);
            } else {
                setLocationStatus('No facilities found nearby.');
            }
        } catch (error) {
            console.error('Location/Fetch error:', error);
            Alert.alert('Error', 'Failed to detect location or fetch data. Please try again or check your internet connection.');
            setLocationStatus('Failed to find data.');
        } finally {
            setLoading(false);
        }
    };

    const openInMaps = (lat: number, lon: number, label: string) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lon}`;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${encodeURIComponent(label)})`
        });

        if (url) {
            Linking.openURL(url).catch(() => {
                Alert.alert('Error', 'Could not open maps application.');
            });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Find PHC</Text>
                    <View style={{ width: 60 }} />
                </Animated.View>

                {/* ── Info & Detect Button ── */}
                <View style={styles.topSection}>
                    <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                        <Text style={styles.title}>Locate Nearby Centers</Text>
                        <Text style={styles.subtitle}>
                            We'll use your current location to find the closest Primary Health Centers, clinics, and hospitals.
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.duration(500).delay(200)}>
                        <TouchableOpacity
                            style={[styles.detectBtn, loading && styles.detectBtnDisabled]}
                            onPress={handleDetectLocation}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text style={styles.detectBtnIcon}>📍</Text>
                                    <Text style={styles.detectBtnText}>Detect My Location</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.doctorsBtn}
                            onPress={() => router.push('/nearby-doctors' as any)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.doctorsBtnIcon}>👨‍⚕️</Text>
                            <Text style={styles.doctorsBtnText}>Connect to Nearby Doctors</Text>
                        </TouchableOpacity>

                        {searched && (
                            <Text style={styles.statusText}>{locationStatus}</Text>
                        )}
                    </Animated.View>
                </View>

                {/* ── Results List ── */}
                <ScrollView
                    style={styles.resultsContainer}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {facilities.map((place, index) => {
                        // Mapbox standard response format extraction
                        const placeName = place.text || 'Healthcare Center';
                        const address = place.properties?.address || place.place_name?.split(',').slice(1).join(',').trim() || 'Address not provided';
                        const [lon, lat] = place.center;

                        return (
                            <Animated.View
                                key={place.id || index.toString()}
                                entering={FadeInUp.duration(400).delay(250 + (index * 50))}
                                style={styles.card}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardIconBox}>
                                        <Text style={styles.cardIcon}>🏥</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>{placeName}</Text>
                                        <Text style={styles.cardAddress} numberOfLines={2}>{address}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.mapBtn}
                                    onPress={() => openInMaps(lat, lon, placeName)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.mapBtnText}>🗺️ Open in Maps</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}

                    {facilities.length > 0 ? <View style={{ height: 40 }} /> : null}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D1B2E' },
    safeArea: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: '#3D8EFF', fontSize: 16, fontWeight: '600' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

    topSection: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1E3A5A',
    },
    title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#9BB4D0', lineHeight: 22, marginBottom: 24 },

    detectBtn: {
        flexDirection: 'row',
        backgroundColor: '#3D8EFF',
        borderRadius: 16,
        paddingVertical: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3D8EFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    detectBtnDisabled: { backgroundColor: '#1E3A5A', shadowOpacity: 0 },
    detectBtnIcon: { fontSize: 20, marginRight: 8 },
    detectBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    doctorsBtn: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        borderRadius: 16,
        paddingVertical: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#3D8EFF',
        marginTop: 12,
    },
    doctorsBtnIcon: { fontSize: 20, marginRight: 8 },
    doctorsBtnText: { color: '#3D8EFF', fontSize: 16, fontWeight: '700' },

    statusText: {
        color: '#9BB4D0',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '500'
    },

    resultsContainer: { flex: 1 },
    listContent: { paddingHorizontal: 20, paddingTop: 20 },

    card: {
        backgroundColor: '#132236',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1E3A5A',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardIconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1E3A5A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardIcon: { fontSize: 24 },
    cardInfo: { flex: 1 },
    cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    cardAddress: { color: '#9BB4D0', fontSize: 13, lineHeight: 18 },

    mapBtn: {
        backgroundColor: '#1E3A5A',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    mapBtnText: { color: '#C8D8EA', fontSize: 14, fontWeight: '600' },
});
