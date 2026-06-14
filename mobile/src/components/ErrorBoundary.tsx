// ============================================================
// Class-based error boundary. Catches render/lifecycle crashes in its
// subtree and shows a recoverable fallback instead of a white screen.
// Each tab is wrapped in one (see navigation/MainTabs.tsx) so a crash
// in one tab can't take down the whole app.
// ============================================================

import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../lib/useTheme';
import { FontFamily } from '../../tokens';

// Function component so it can read theme tokens via hook — the boundary
// itself must be a class (only classes can be error boundaries).
function DefaultFallback({ onRetry }: { onRetry: () => void }) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: tokens.bg }]}>
      <View
        style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: tokens.tealLight,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            fill="none" stroke={tokens.teal} strokeWidth={1.8} strokeLinejoin="round"
          />
          <Path d="M12 9v4M12 17h.01" stroke={tokens.teal} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      </View>

      <Text style={{ fontFamily: FontFamily.displayXBold, fontSize: 17, color: tokens.text1, marginBottom: 6, textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text style={{ fontFamily: FontFamily.body, fontSize: 13, color: tokens.text3, textAlign: 'center', marginBottom: 18 }}>
        This screen hit an unexpected error. You can try loading it again.
      </Text>

      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.85}
        style={{ backgroundColor: tokens.teal, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999 }}
      >
        <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: tokens.surface }}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <DefaultFallback onRetry={() => this.setState({ hasError: false, error: null })} />
        )
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
