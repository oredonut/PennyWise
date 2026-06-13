// ============================================================
// PennyWise — SplashScreen
//
// Animations:
//   1. Logo        — scale-bounce (0.7 → 1.05 → 1.0) + fade + slide-up
//   2. Logo shake  — after landing: quick wobble, then settles
//   3. Wordmark    — fade + slide-up + subtle scale
//   4. Tagline     — fade + slide-up
//   5. Stars       — fade + slide-up, then independent twinkle loops
//   6. Loading bar — fills over 2.5 s + shimmer sweep moving across fill
//   7. Scribbles   — fade in gradually (not instant-on)
//
// Design rules:
//   • Follows system light/dark via useTheme() — token swap only
//   • ScribbleLayer z=0, pointerEvents none
//   • Amber (#d97706) NOT used — reserved for Discipline Score only
//   • JetBrains Mono only on "getting things ready..." label
// ============================================================

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
import { useTheme }      from '../../lib/useTheme';

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  // ── Entrance values ────────────────────────────────────────
  const logoAnim    = useRef(new Animated.Value(0)).current;
  const titleAnim   = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const starsAnim   = useRef(new Animated.Value(0)).current;

  // ── Post-entrance effects ──────────────────────────────────
  const logoWobble  = useRef(new Animated.Value(0)).current; // rotation shake
  const star1Scale  = useRef(new Animated.Value(1)).current;
  const star2Scale  = useRef(new Animated.Value(1)).current;
  const star3Scale  = useRef(new Animated.Value(1)).current;

  // ── Loading bar + shimmer ──────────────────────────────────
  const barProgress = useRef(new Animated.Value(0)).current;
  const shimmerPos  = useRef(new Animated.Value(0)).current;

  // ── Scribble layer fade ────────────────────────────────────
  const scribbleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── 1. Entrance animations ─────────────────────────────
    const enter = (anim: Animated.Value, delay: number) =>
      Animated.timing(anim, {
        toValue: 1, duration: 620, delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

    Animated.parallel([
      enter(logoAnim,    0),
      enter(titleAnim,   150),
      enter(taglineAnim, 290),
      enter(starsAnim,   430),
    ]).start(() => {
      // ── 2. Logo shake after landing ──────────────────────
      Animated.sequence([
        Animated.timing(logoWobble, { toValue: -9,  duration: 150, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
        Animated.timing(logoWobble, { toValue:  7,  duration: 130, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(logoWobble, { toValue: -4,  duration: 110, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(logoWobble, { toValue:  2,  duration:  90, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(logoWobble, { toValue:  0,  duration:  80, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
      ]).start();

      // ── 3. Star twinkle loops (staggered start offsets) ──
      const twinkle = (pulse: Animated.Value, pauseMs: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(pauseMs),
            Animated.timing(pulse, { toValue: 1.4,  duration: 380, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0.72, duration: 320, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1.0,  duration: 260, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.delay(1100),
          ])
        );

      twinkle(star1Scale, 0).start();
      twinkle(star2Scale, 380).start();
      twinkle(star3Scale, 720).start();
    });

    // ── 4. Scribble fade-in ────────────────────────────────
    Animated.timing(scribbleOpacity, {
      toValue: 1, duration: 2000, delay: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // ── 5. Loading bar ─────────────────────────────────────
    const barTimer = setTimeout(() => {
      Animated.timing(barProgress, {
        toValue: 1, duration: 2500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false, // width can't use native driver
      }).start(({ finished }) => { if (finished) onFinish?.(); });
    }, 420);

    // ── 6. Shimmer loop ────────────────────────────────────
    const shimmerTimer = setTimeout(() => {
      Animated.loop(
        Animated.timing(shimmerPos, {
          toValue: 1, duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }, 500);

    return () => {
      clearTimeout(barTimer);
      clearTimeout(shimmerTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Interpolation helpers ──────────────────────────────────

  /** Logo: scale-bounce + fade + slide-up */
  const logoStyle = {
    opacity: logoAnim,
    transform: [
      {
        translateY: logoAnim.interpolate({
          inputRange: [0, 1], outputRange: [22, 0],
        }),
      },
      {
        scale: logoAnim.interpolate({
          inputRange:  [0, 0.55, 0.85, 1],
          outputRange: [0.7, 1.08, 0.96, 1.0],
        }),
      },
    ],
  };

  /** Wobble rotation applied to inner logo wrapper */
  const wobbleRotation = logoWobble.interpolate({
    inputRange:  [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  /** Other elements: fade + slide-up + gentle scale.
   *  Return is `any` because RN's strict transform-union type rejects
   *  hand-built [{translateY},{scale}] arrays even though they are valid. */
  const mkEntrance = (anim: Animated.Value): any => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1], outputRange: [18, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1], outputRange: [0.9, 1.0],
        }),
      },
    ],
  });

  const barWidthInterpolated = barProgress.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  /** Shimmer sweeps from -50 → 170 px across the 120 px bar */
  const shimmerTranslate = shimmerPos.interpolate({
    inputRange: [0, 1], outputRange: [-50, 170],
  });

  // ── Render ─────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: tokens.bg }]}>

      {/* ── Scribble — fades in gradually ─────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: scribbleOpacity }]}
      >
        <ScribbleLayer color={tokens.doodle} />
      </Animated.View>

      {/* ── Centre content ──────────────────────────────────── */}
      <View style={styles.content}>

        {/* Logo: scale-bounce entrance, inner wobble rotation */}
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Animated.View style={{ transform: [{ rotate: wobbleRotation }] }}>
            <Logomark size={104} />
          </Animated.View>
        </Animated.View>

        {/* Wordmark */}
        <Animated.Text
          style={[
            styles.wordmark,
            mkEntrance(titleAnim),
            { fontFamily: FontFamily.displayXBold, color: tokens.text1 },
          ]}
        >
          PennyWise
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            mkEntrance(taglineAnim),
            { fontFamily: FontFamily.body, color: tokens.text2 },
          ]}
        >
          your money, your score
        </Animated.Text>

        {/* Star cluster — each star has independent twinkle */}
        <Animated.View style={[styles.stars, mkEntrance(starsAnim)]}>
          <Animated.View style={{ transform: [{ scale: star1Scale }] }}>
            <DoodleStar color={tokens.teal} size={18} />
          </Animated.View>

          <View style={styles.starMid}>
            <Animated.View style={{ transform: [{ scale: star2Scale }] }}>
              <DoodleStar color={tokens.teal} size={22} />
            </Animated.View>
          </View>

          <Animated.View style={{ transform: [{ scale: star3Scale }] }}>
            <DoodleStar color={tokens.teal} size={18} />
          </Animated.View>
        </Animated.View>

      </View>

      {/* ── Footer — loading bar ────────────────────────────── */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
      >
        {/* Track with shimmer overlay */}
        <View style={[styles.barTrack, { backgroundColor: tokens.surfaceTint }]}>
          {/* Teal fill */}
          <Animated.View
            style={[styles.barFill, { width: barWidthInterpolated, backgroundColor: tokens.teal }]}
          />
          {/* Shimmer sweep across the full track */}
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.loadingLabel,
            { fontFamily: FontFamily.mono, color: tokens.text3 },
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
    // gap to wordmark handled by wordmark marginTop
  },

  wordmark: {
    fontWeight:    '800',
    fontSize:      34,
    marginTop:     26,
    letterSpacing: -0.68, // -0.02 em at 34 px
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

  starMid: {
    marginTop: -4, // middle star sits 4 px higher per design spec
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
    overflow:     'hidden', // clips both fill and shimmer
  },

  barFill: {
    position:     'absolute',
    top:          0,
    left:         0,
    bottom:       0,
    borderRadius: 999,
  },

  shimmer: {
    position:        'absolute',
    top:             0,
    bottom:          0,
    width:           36,
    borderRadius:    999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },

  loadingLabel: {
    fontSize: 12,
  },
});
