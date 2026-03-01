import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <ThemedText style={styles.logoTextInside}>+</ThemedText>
              </View>
              <ThemedText style={styles.logoText}>GramHealth</ThemedText>
            </View>
            <TouchableOpacity style={styles.menuButton}>
              <ThemedText style={styles.menuText}>Menu</ThemedText>
            </TouchableOpacity>
          </Animated.View>

          {/* Hero Section */}
          <View style={[styles.heroSection, isTablet && styles.heroSectionTablet]}>
            <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.heroTextContainer}>
              <ThemedText style={styles.badgeText}>🌍 RURAL HEALTHCARE REIMAGINED</ThemedText>
              <ThemedText style={styles.heroTitle}>
                Quality Healthcare, Anywhere You Live.
              </ThemedText>
              <ThemedText style={styles.heroSubtitle}>
                Empowering communities with remote doctors, affordable medicines, and offline health tracking. Bridging the gap for a healthier tomorrow.
              </ThemedText>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.primaryButton}>
                  <ThemedText style={styles.primaryButtonText}>Get Care Now</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton}>
                  <ThemedText style={styles.secondaryButtonText}>Learn More</ThemedText>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeIn.duration(1000).delay(400)} style={styles.heroImageContainer}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1576091160550-2173ff9e5eb3?auto=format&fit=crop&q=80&w=800" }}
                style={styles.heroImage}
                contentFit="cover"
                transition={500}
              />
              <View style={styles.floatingCard}>
                <ThemedText style={styles.floatingCardTitle}>👩🏽‍⚕️ Dr. Sharma</ThemedText>
                <ThemedText style={styles.floatingCardSub}>Online • General Physician</ThemedText>
              </View>
            </Animated.View>
          </View>

           <Link href="/testdb" style={{ marginTop: 20 }}>
              Go To DB Test
            </Link>

          {/* Features Grid */}
          <Animated.View entering={FadeInUp.duration(800).delay(600)} style={styles.featuresSection}>
            <ThemedText style={styles.sectionTitle}>Our Services</ThemedText>
            <View style={[styles.featuresGrid, isTablet && styles.featuresGridTablet]}>

              <View style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: '#E8F5E9' }]}>
                  <ThemedText style={styles.featureIcon}>📱</ThemedText>
                </View>
                <ThemedText style={styles.featureTitle}>Teleconsultation</ThemedText>
                <ThemedText style={styles.featureDesc}>Connect with top doctors via low-bandwidth video or voice calls.</ThemedText>
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: '#E3F2FD' }]}>
                  <ThemedText style={styles.featureIcon}>💊</ThemedText>
                </View>
                <ThemedText style={styles.featureTitle}>Medicine Delivery</ThemedText>
                <ThemedText style={styles.featureDesc}>Prescriptions delivered weekly right to your village center.</ThemedText>
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: '#FFF3E0' }]}>
                  <ThemedText style={styles.featureIcon}>📁</ThemedText>
                </View>
                <ThemedText style={styles.featureTitle}>Offline Records</ThemedText>
                <ThemedText style={styles.featureDesc}>Store health data locally when offline, sync automatically when connected.</ThemedText>
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: '#FCE4EC' }]}>
                  <ThemedText style={styles.featureIcon}>🚑</ThemedText>
                </View>
                <ThemedText style={styles.featureTitle}>Emergency Connect</ThemedText>
                <ThemedText style={styles.featureDesc}>One-tap SOS dispatch for mobile clinics and rural ambulance services.</ThemedText>
              </View>

            </View>
          </Animated.View>

          {/* Stats Bar */}
          <Animated.View entering={FadeInUp.duration(800).delay(800)} style={styles.statsSection}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>500+</ThemedText>
              <ThemedText style={styles.statLabel}>Villages Reached</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>50k+</ThemedText>
              <ThemedText style={styles.statLabel}>Patients Served</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>24/7</ThemedText>
              <ThemedText style={styles.statLabel}>Support Active</ThemedText>
            </View>
          </Animated.View>

          {/* Footer CTA */}
          <Animated.View entering={FadeInUp.duration(800).delay(1000)} style={styles.footerCTA}>
            <ThemedText style={styles.footerTitle}>Join Our Health Network</ThemedText>
            <ThemedText style={styles.footerSub}>Be a part of the movement bringing modern healthcare to rural communities.</ThemedText>
            <TouchableOpacity style={styles.primaryButton}>
              <ThemedText style={styles.primaryButtonText}>Download the App</ThemedText>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    backgroundColor: '#2E7D32',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoTextInside: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: -2,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: -0.5,
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EEEEEE',
    borderRadius: 20,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  heroSection: {
    flexDirection: 'column',
    gap: 32,
    marginBottom: 48,
  },
  heroSectionTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextContainer: {
    flex: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 1,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: '#333333',
    fontWeight: '600',
    fontSize: 16,
  },
  heroImageContainer: {
    flex: 1,
    position: 'relative',
    height: 350,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  floatingCard: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'column',
  },
  floatingCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  floatingCardSub: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  featuresSection: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featuresGridTablet: {
    gap: 24,
  },
  featureCard: {
    width: Platform.OS === 'web' ? '47%' : '100%',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1B5E20',
    padding: 32,
    borderRadius: 24,
    marginBottom: 48,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A5D6A7',
    fontWeight: '600',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2E7D32',
    height: '100%',
  },
  footerCTA: {
    backgroundColor: '#E8F5E9',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 40,
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  footerSub: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
