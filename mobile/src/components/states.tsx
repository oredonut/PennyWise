// ============================================================
// Shared loading / error UI used by the data-wired tab screens.
// SkeletonBox pulses opacity 0.3↔0.7; ErrorState is a centred card
// with a retry button.
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/useTheme';
import { FontFamily } from '../../tokens';

/** A looping pulse value (0.3 → 0.7) for skeleton placeholders. */
export function usePulse(): Animated.Value {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.7, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return pulse;
}

export function SkeletonBox({ pulse, style }: { pulse: Animated.Value; style?: any }) {
  const { tokens } = useTheme();
  return <Animated.View style={[{ backgroundColor: tokens.surfaceTint, borderRadius: 8, opacity: pulse }, style]} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { tokens } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>⚠️</Text>
        <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 16, color: tokens.text1, marginBottom: 6, textAlign: 'center' }}>
          Something went wrong
        </Text>
        <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, textAlign: 'center', marginBottom: 16 }}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={onRetry}
          style={{ backgroundColor: tokens.teal, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999 }}
          activeOpacity={0.85}
        >
          <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: tokens.surface }}>Try again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 420, paddingHorizontal: 24 },
  card: { alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 24, width: '100%' },
});
