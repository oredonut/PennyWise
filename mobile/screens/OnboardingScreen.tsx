// ============================================================
// Onboarding (screen 02) — first-run value-prop intro.
//
// Flow: Splash → Onboarding → Login. On "Get Started" we persist a flag so
// returning users skip straight to Login on later launches (gate read in
// App.tsx's Splash onFinish).
//
// design.md has no copy block for this screen (the "02 Onboarding" entry is
// only a row in the §8 screen-inventory table), so copy here is sourced from
// existing brand material: the splash tagline ("your money, your score"), the
// §1 design philosophy, the §11 copy conventions (direct, slightly roast-y),
// and the app's actual features (OCR snap, Discipline Score, streaks/roast).
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../lib/useTheme';
import { FontFamily, Radius } from '../tokens';
import { ScribbleLayer } from '../src/components/ScribbleLayer';
import { Logomark } from '../src/components/Logomark';

export const ONBOARDED_KEY = '@pennywise_onboarded';

type RootStackParamList = { Onboarding: undefined; Login: undefined };
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'> };

const FEATURES: { emoji: string; title: string; desc: string }[] = [
  { emoji: '📸', title: 'Snap your receipts', desc: 'We read the numbers off — no manual typing.' },
  { emoji: '🎯', title: 'Know your Discipline Score', desc: 'One honest number, updated as you spend.' },
  { emoji: '🔥', title: 'Keep your streak alive', desc: 'Daily nudges and a monthly roast to keep you sharp.' },
];

export default function OnboardingScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const handleGetStarted = async () => {
    // Best-effort: even if persistence fails, still move the user forward.
    try {
      await AsyncStorage.setItem(ONBOARDED_KEY, '1');
    } catch {
      // ignore — worst case they see onboarding again next launch
    }
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <ScribbleLayer color={tokens.doodle} />

      <View style={styles.content}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <Logomark size={56} />
          <Text style={[styles.wordmark, { color: tokens.text1 }]}>
            Penny<Text style={{ color: tokens.teal }}>Wise</Text>
          </Text>
        </View>

        {/* Headline */}
        <Text style={[styles.headline, { color: tokens.text1 }]}>Your money, your score.</Text>
        <Text style={[styles.sub, { color: tokens.text2 }]}>
          Track your spending and own your score — no cold bank vibes.
        </Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[styles.featureRow, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: tokens.tealLight }]}>
                <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: tokens.text1 }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: tokens.text3 }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Primary CTA */}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: tokens.teal }]}
        activeOpacity={0.85}
        onPress={handleGetStarted}
      >
        <Text style={[styles.btnText, { color: tokens.surface }]}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center', zIndex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 36 },
  wordmark: { fontFamily: FontFamily.displayXBold, fontSize: 24 },
  headline: { fontFamily: FontFamily.displayXBold, fontSize: 30, lineHeight: 36, marginBottom: 10 },
  sub: { fontFamily: FontFamily.body, fontSize: 15, lineHeight: 22, marginBottom: 32 },
  featureList: { gap: 12 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 14,
  },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontFamily: FontFamily.displayXBold, fontSize: 15, marginBottom: 2 },
  featureDesc: { fontFamily: FontFamily.body, fontSize: 13, lineHeight: 18 },
  btn: {
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  btnText: { fontFamily: FontFamily.display, fontSize: 16, letterSpacing: 0.2 },
});
