// ============================================================
// Onboarding — placeholder for now (real budget-setup flow lands
// in 2D). Kept navigable so new users aren't trapped: Continue
// resets into the main tabs.
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../lib/useTheme';
import { FontFamily, Radius } from '../tokens';

type RootStackParamList = { Onboarding: undefined; MainTabs: undefined };
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'> };

export default function OnboardingScreen({ navigation }: Props) {
  const { tokens } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🚧</Text>
      <Text style={[styles.title, { color: tokens.text1 }]}>Let's set up your budget</Text>
      <Text style={[styles.sub, { color: tokens.text3 }]}>
        Onboarding is coming soon (2D). For now, jump straight into the app.
      </Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: tokens.teal }]}
        activeOpacity={0.85}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
      >
        <Text style={[styles.btnText, { color: tokens.surface }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontFamily: FontFamily.display, fontSize: 24, textAlign: 'center', marginBottom: 8 },
  sub: { fontFamily: FontFamily.body, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  btn: {
    height: 52, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 48,
  },
  btnText: { fontFamily: FontFamily.display, fontSize: 16, letterSpacing: 0.2 },
});
