import React, { useState } from 'react';
import { Text, TextInput } from '@/components/AppText';

import { StyleSheet, View, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

// Dummy patient data based on HTML
const PATIENTS = [
    {
        id: '1',
        name: 'Priya Sharma',
        statusLabel: 'Normal',
        statusColor: '#10B981', // Green
        statusBg: '#D1FAE5',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150',
        indicators: ['Week 28', 'Last seen 5d ago'],
    },
    {
        id: '2',
        name: 'Meena K.',
        statusLabel: 'HIGH RISK',
        statusColor: '#FFFFFF', // White text
        statusBg: '#EF4444', // Red bg
        imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150',
        indicators: ['Week 34', 'Last seen 18d ago (warning)'],
        isHighRisk: true,
    },
    {
        id: '3',
        name: 'Sunita B.',
        statusLabel: 'Pending Review',
        statusColor: '#B45309', // Yellow-700
        statusBg: '#FEF3C7',
        imageUrl: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=150',
        indicators: ['Week 22', 'Needs Verification'],
    },
    {
        id: '4',
        name: 'Ravi Kumar',
        statusLabel: 'Watch',
        statusColor: '#EA580C',
        statusBg: '#FFEDD5',
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150',
        indicators: [],
        condition: 'Hypertension',
        metric: '160/100',
        action: 'Follow-up required',
    },
];

const FILTERS = ['All', 'Pregnant', 'High Risk', 'Not Visited 30d'];

export default function PatientListScreen() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0fdfa" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>

                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                        <Text style={styles.iconText}>☰</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Patient Registry</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.iconButton}>
                        <Text style={styles.iconText}>🔔</Text>
                    </TouchableOpacity>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=100' }}
                        style={styles.avatar}
                    />
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
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
                    {PATIENTS.map((p) => (
                        <TouchableOpacity key={p.id} style={[styles.card, p.isHighRisk && styles.cardHighRisk]} activeOpacity={0.8}>
                            <View style={styles.cardAvatarContainer}>
                                <Image source={{ uri: p.imageUrl }} style={[styles.cardAvatar, p.isHighRisk && styles.cardAvatarHighRisk]} />
                                <View style={[styles.statusDot, { backgroundColor: p.isHighRisk ? '#EF4444' : (p.statusColor === '#B45309' ? '#EAB308' : '#10B981') }]} />
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardName}>{p.name}</Text>
                                    <View style={[styles.badge, { backgroundColor: p.statusBg }]}>
                                        <Text style={[styles.badgeText, { color: p.statusColor }]}>{p.statusLabel}</Text>
                                    </View>
                                </View>

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
                                        {p.indicators.map((ind, i) => (
                                            <Text key={i} style={[styles.indicatorText, ind.includes('warning') && styles.indicatorWarning]}>
                                                {ind.replace(' (warning)', '')}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Bottom Nav padding compensation */}
                <View style={{ height: 60 }} />

                {/* FAB */}
                <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>

                {/* Bottom Nav */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIconActive}>👥</Text>
                        <Text style={styles.navTextActive}>Patients</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>📅</Text>
                        <Text style={styles.navText}>Visits</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>✅</Text>
                        <Text style={styles.navText}>Tasks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>⚙️</Text>
                        <Text style={styles.navText}>Tools</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdfa', // tailwind background-light
    },
    safeArea: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconButton: {
        padding: 8,
    },
    iconText: {
        fontSize: 24,
        color: '#0d9488',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
        marginLeft: 8,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#0d9488',
        marginLeft: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 14,
        color: '#0f172a',
    },
    filtersWrapper: {
        marginTop: 16,
        marginBottom: 8,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#0d9488',
        borderColor: '#0d9488',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    filterTextActive: {
        color: '#ffffff',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 12,
    },
    cardHighRisk: {
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    cardAvatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    cardAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f1f5f9',
    },
    cardAvatarHighRisk: {
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    cardName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    indicatorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 4,
    },
    indicatorText: {
        fontSize: 13,
        color: '#64748b',
    },
    indicatorWarning: {
        color: '#ef4444',
        fontWeight: '500',
    },
    chevron: {
        fontSize: 24,
        color: '#cbd5e1',
        marginLeft: 8,
    },
    conditionBlock: {
        marginTop: 4,
    },
    conditionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    metricRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 12,
    },
    metricBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    metricText: {
        fontSize: 13,
        color: '#ef4444',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    actionText: {
        fontSize: 13,
        color: '#64748b',
    },
    fab: {
        position: 'absolute',
        bottom: 96,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0d9488',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    fabIcon: {
        fontSize: 28,
        color: '#ffffff',
        lineHeight: 30, // to visually center the + on some devices
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#ffffff',
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    navItem: {
        alignItems: 'center',
    },
    navIcon: {
        fontSize: 24,
        color: '#94a3b8',
        marginBottom: 4,
    },
    navIconActive: {
        fontSize: 24,
        color: '#0d9488',
        marginBottom: 4,
    },
    navText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#94a3b8',
    },
    navTextActive: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#0d9488',
    },
});
