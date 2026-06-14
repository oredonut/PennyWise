// ============================================================
// Renders transient toast messages emitted via lib/toast.ts.
// Mount once, at the app root. Fades a pill in at the bottom of the
// screen, holds ~2.5s, then fades out. New messages reset the timer.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View, StyleSheet } from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../lib/useTheme';
import { FontFamily, Radius } from '../../tokens';
import { TOAST_EVENT } from '../../lib/toast';

const VISIBLE_MS = 2500;

export default function ToastHost() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(TOAST_EVENT, (msg: string) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMessage(msg);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setMessage(null));
      }, VISIBLE_MS);
    });

    return () => {
      sub.remove();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [opacity]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center' }]}>
      <Animated.View
        style={{
          opacity,
          maxWidth: '86%',
          marginBottom: insets.bottom + 90, // clear the tab bar + FAB
          backgroundColor: tokens.text1,
          borderRadius: Radius.pill,
          paddingHorizontal: 18,
          paddingVertical: 12,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: tokens.bg, textAlign: 'center' }}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}
