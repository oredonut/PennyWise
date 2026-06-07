// ============================================================
// PennyWise — SplashScreen
// Screen 01 — the very first thing a user sees.
//
// Behaviour:
//   • Native expo-splash-screen hides once fonts are loaded (in App.tsx)
//   • This custom splash then runs: logo + wordmark + tagline animate up
//   • Loading bar fills over ~2.5 s (cosmetic, signals "loading")
//   • After bar completes, onFinish() is called → navigate to Onboarding
//
// Design rules enforced:
//   • ALWAYS light mode — splash is a brand moment, never dark
//   • ScribbleLayer z-index 0, pointerEvents none
//   • Amber (#d97706) NOT used — reserved for Discipline Score only
//   • JetBrains Mono only on "getting things ready..." label
// ============================================================

// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScribbleLayer } from '../../src/components/ScribbleLayer';
import { Logomark }      from '../../src/components/Logomark';
import { DoodleStar }    from '../../src/components/DoodleStar';
import { FontFamily }    from '../../tokens';

// ── Light-mode tokens (splash is always light) ────────────────
// Pull directly from the raw token file — bypasses Appearance API
const T = {
  bg:          '#faf7f2',
  text1:       '#1a1714',
  text2:       '#6b6157',
  text3:       '#a89e95',
  teal:        '#0f766e',
  surfaceTint: '#f3ede4',
  doodle:      '#c9bfb5',
} as const;

// ── Types ──────────────────────────────────────────────────────
interface SplashScreenProps {
  /** Called when the loading bar finishes — navigate to Onboarding here */
  onFinish?: () => void;
}

// ── Component ──────────────────────────────────────────────────
export function SplashScreen({ onFinish }: SplashScreenProps) {
  const insets = useSafeAreaInsets();

  // ── Animated values (entrance stagger) ──────────────────────
  const logoAnim    = useRef(new Animated.Value(0)).current;
  const titleAnim   = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const starsAnim   = useRef(new Animated.Value(0)).current;
  const barProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = (anim: Animated.Value, delay: number) =>
      Animated.timing(anim, {
        toValue:         1,
        duration:        600,
        delay,
        easing:          Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

    // Staggered entrance — logo → wordmark → tagline → stars
    Animated.parallel([
      entrance(logoAnim,    0),
      entrance(titleAnim,   120),
      entrance(taglineAnim, 260),
      entrance(starsAnim,   400),
    ]).start();

    // Loading bar starts after a brief pause, fills over 2.5 s
    const barTimer = setTimeout(() => {
      Animated.timing(barProgress, {
        toValue:         1,
        duration:        2500,
        easing:          Easing.inOut(Easing.quad),
        useNativeDriver: false, // animates width — cannot use native driver
      }).start(({ finished }) => {
        if (finished) onFinish?.();
      });
    }, 420);

    return () => clearTimeout(barTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Interpolation helper ─────────────────────────────────────
  const entranceStyle = (anim: Animated.Value) => ({
    opacity:   anim,
    transform: [{
      translateY: anim.interpolate({
        inputRange:  [0, 1],
        outputRange: [18, 0],
      }),
    }],
  });

  const barWidthInterpolated = barProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: T.bg }]}>

      {/* Scribble texture — behind everything */}
      <ScribbleLayer color={T.doodle} />

      {/* ── Centre content ──────────────────────────────────── */}
      <View style={styles.content}>

        {/* Logo */}
        <Animated.View style={[styles.logoWrap, entranceStyle(logoAnim)]}>
          <Logomark size={104} />
        </Animated.View>

        {/* Wordmark */}
        <Animated.Text
          style={[
            styles.wordmark,
            entranceStyle(titleAnim),
            { fontFamily: FontFamily.displayXBold, color: T.text1 },
          ]}
        >
          PennyWise
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            entranceStyle(taglineAnim),
            { fontFamily: FontFamily.body, color: T.text2 },
          ]}
        >
          your money, your score
        </Animated.Text>

        {/* Doodle star cluster */}
        <Animated.View style={[styles.stars, entranceStyle(starsAnim)]}>
          <DoodleStar color={T.teal} size={18} />
          <View style={styles.starMid}>
            <DoodleStar color={T.teal} size={22} />
          </View>
          <DoodleStar color={T.teal} size={18} />
        </Animated.View>

      </View>

      {/* ── Footer — loading bar ────────────────────────────── */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
      >
        {/* Track */}
        <View style={[styles.barTrack, { backgroundColor: T.surfaceTint }]}>
          {/* Fill */}
          <Animated.View
            style={[
              styles.barFill,
              { width: barWidthInterpolated, backgroundColor: T.teal },
            ]}
          />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.loadingLabel,
            { fontFamily: FontFamily.mono, color: T.text3 },
          ]}
        >
          getting things ready...
        </Text>
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    flex:              1,
    zIndex:            1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 40,
  },

  logoWrap: {
    // spacing to wordmark handled by wordmark marginTop
  },

  wordmark: {
    fontWeight:    '800',
    fontSize:      34,
    marginTop:     26,
    letterSpacing: -0.68, // -0.02em at 34 px
    textAlign:     'center',
  },

  tagline: {
    fontStyle:  'italic',
    fontSize:   14,
    marginTop:  6,
    textAlign:  'center',
  },

  stars: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     18,
    gap:           10,
  },

  // Middle star sits 4 px higher — mirrors web prototype's marginTop: -4
  starMid: {
    marginTop: -4,
  },

  footer: {
    zIndex:     1,
    alignItems: 'center',
    gap:        12,
  },

  barTrack: {
    width:        120,
    height:       4,
    borderRadius: 999,
    overflow:     'hidden',
  },

  barFill: {
    height:       '100%',
    borderRadius: 999,
  },

  loadingLabel: {
    fontSize: 12,
  },
});
