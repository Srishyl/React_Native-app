import React, { useState, useRef, useCallback } from 'react';
import { Text } from '@/components/AppText';

import { StyleSheet, View, TouchableOpacity, FlatList, Dimensions, StatusBar, Platform, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Slides Data ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    image: require('../../assets/healthcare_family.png'),
    title: 'Book PHC visits easily',
    subtitle:
      'Track your pregnancy journey and get help anytime, even offline.',
  },
  {
    id: '2',
    image: require('../../assets/phc_booking.png'),
    title: 'Connect with Health Workers',
    subtitle:
      'Get guidance from ASHA workers and ANMs right from your village.',
  },
  {
    id: '3',
    image: require('../../assets/pregnancy_tracking.png'),
    title: 'Your Health, Offline & Online',
    subtitle:
      'All your records stored securely, synced when you have connectivity.',
  },
];

// ─── Language Options ─────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
];

// ─── Dot Indicator ────────────────────────────────────────────────────────────
function DotIndicator({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={dotStyles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i === activeIndex ? dotStyles.activeDot : dotStyles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#3D8EFF',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

// ─── Slide Item ────────────────────────────────────────────────────────────────
function SlideItem({ item }: { item: typeof SLIDES[0] }) {
  return (
    <View style={slideStyles.slideContainer}>
      {/* Illustration Card */}
      <View style={slideStyles.imageCard}>
        <View style={slideStyles.imageCircle} />
        <Image
          source={item.image}
          style={slideStyles.image}
          contentFit="contain"
          transition={300}
        />
      </View>
    </View>
  );
}

const slideStyles = StyleSheet.create({
  slideContainer: {
    width: SCREEN_WIDTH - 48,
    alignItems: 'center',
  },
  imageCard: {
    width: '100%',
    height: 240,
    backgroundColor: '#CAE8E6',
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E8F5F4',
    opacity: 0.6,
  },
  image: {
    width: '90%',
    height: '90%',
  },
});

import { useLanguage } from '../contexts/LanguageContext';

// ─── Main Landing Screen ───────────────────────────────────────────────────────
export default function LandingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const { language: selectedLang, setLanguage: setSelectedLang } = useLanguage();
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2E" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* ── Logo / Header ── */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
          <View style={styles.logoIconWrapper}>
            <Text style={styles.logoIconEmoji}>🩺</Text>
          </View>
          <Text style={styles.appName}>HealthBridge</Text>
          <Text style={styles.tagline}>Your health, in your hands.</Text>
        </Animated.View>

        {/* ── Carousel ── */}
        <Animated.View entering={FadeIn.duration(800).delay(300)} style={styles.carouselSection}>
          <FlatList
            ref={flatListRef}
            data={SLIDES}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH - 48}
            decelerationRate="fast"
            contentContainerStyle={styles.flatListContent}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewConfigRef.current}
            renderItem={({ item }) => <SlideItem item={item} />}
          />

          {/* Slide Text */}
          <Animated.View
            key={activeIndex}
            entering={FadeInUp.duration(400)}
            style={styles.slideTextContainer}
          >
            <Text style={styles.slideTitle}>{SLIDES[activeIndex].title}</Text>
            <Text style={styles.slideSubtitle}>{SLIDES[activeIndex].subtitle}</Text>
          </Animated.View>

          {/* Dot Indicator */}
          <DotIndicator count={SLIDES.length} activeIndex={activeIndex} />
        </Animated.View>

        {/* ── CTA Buttons ── */}
        <Animated.View entering={FadeInUp.duration(700).delay(500)} style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.patientButton}
            activeOpacity={0.85}
            onPress={() => router.push('/patient-login' as any)}
          >
            <Text style={styles.patientButtonText}>Get Started as Patient</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.workerButton}
            activeOpacity={0.85}
            onPress={() => router.push('/worker-login' as any)}
          >
            <Text style={styles.workerButtonText}>Login as Health Worker</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Language Selector ── */}
        <Animated.View entering={FadeIn.duration(600).delay(700)} style={styles.langRow}>
          {LANGUAGES.map((lang, index) => (
            <React.Fragment key={lang.code}>
              <TouchableOpacity
                onPress={() => setSelectedLang(lang.code)}
                style={styles.langBtn}
              >
                <Text
                  style={[
                    styles.langText,
                    selectedLang === lang.code && styles.langTextActive,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
              {index < LANGUAGES.length - 1 && (
                <Text style={styles.langDivider}>|</Text>
              )}
            </React.Fragment>
          ))}
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2E',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  logoIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1A3A5C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#3D8EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIconEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#4FC3F7',
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Carousel
  carouselSection: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  flatListContent: {
    gap: 16,
    paddingHorizontal: 0,
  },
  slideTextContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 32,
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#9BB4D0',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  // CTA Buttons
  ctaSection: {
    width: '100%',
    gap: 14,
    marginBottom: 16,
    marginTop: 4,
  },
  patientButton: {
    width: '100%',
    backgroundColor: '#3D8EFF',
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#3D8EFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  patientButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  workerButton: {
    width: '100%',
    backgroundColor: '#00C9A7',
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  workerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Language Selector
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 8 : 16,
    gap: 4,
    flexWrap: 'wrap',
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  langText: {
    color: '#6B8BAE',
    fontSize: 13,
    fontWeight: '500',
  },
  langTextActive: {
    color: '#4FC3F7',
    fontWeight: '700',
  },
  langDivider: {
    color: '#2D4A6A',
    fontSize: 13,
  },
});
