// ============================================================
// Imperative toast. Call Toast.show(...) from anywhere — including
// non-React code (async handlers, the global error handler) — and the
// single <ToastViewport> mounted at the app root renders it.
//
// Ref-based singleton: the mounted viewport registers its push function
// into a module-level slot; Toast.show forwards to it. Only one toast is
// shown at a time; a new call replaces the current one.
//
//   success → green · error → red · info → teal
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../lib/useTheme';
import { FontFamily, Radius } from '../../tokens';

export type ToastType = 'success' | 'error' | 'info';
type ToastState = { message: string; type: ToastType } | null;

// The mounted viewport registers itself here. Null until <ToastViewport>
// mounts (or after it unmounts) — calls before then are silently dropped.
let pushToast: ((message: string, type: ToastType, duration: number) => void) | null = null;

export const Toast = {
  show(message: string, type: ToastType = 'info', duration = 3000): void {
    pushToast?.(message, type, duration);
  },
};

export function ToastViewport() {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [translateY, opacity]);

  useEffect(() => {
    pushToast = (message, type, duration) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, type });
      translateY.setValue(-120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
      hideTimer.current = setTimeout(dismiss, duration);
    };
    return () => {
      pushToast = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [dismiss, translateY, opacity]);

  if (!toast) return null;

  const bg =
    toast.type === 'success' ? tokens.success : toast.type === 'error' ? tokens.danger : tokens.teal;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { alignItems: 'center' }]}>
      <Animated.View
        style={{
          position: 'absolute',
          top: insets.top + 8,
          maxWidth: '92%',
          transform: [{ translateY }],
          opacity,
          backgroundColor: bg,
          borderRadius: Radius.pill,
          paddingHorizontal: 18,
          paddingVertical: 12,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 10,
        }}
      >
        <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: '#fff', textAlign: 'center' }}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}
