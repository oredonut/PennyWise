// ============================================================
// Toggle — shared boolean switch. Replaces the inline switch built into
// AddTransaction ("Repeat this?").
//
// Matches design.md §5 Toggle spec: 46×28 track, pill radius, 22×22 white
// knob, off = --border, on = --teal, knob translates 18px right.
//
//   <Toggle value={recurring} onChange={setRecurring} />
// ============================================================

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Animated, Easing } from 'react-native';

import { useTheme } from '../../lib/useTheme';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onChange, disabled = false }: ToggleProps) {
  const { tokens } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  // Track 46, knob 22, padding 3 → knob travels 46 - 22 - (3 * 2) = 18px.
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onChange(!value)}
      disabled={disabled}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <View
        style={{
          width: 46,
          height: 28,
          borderRadius: 999,
          padding: 3,
          justifyContent: 'center',
          backgroundColor: value ? tokens.teal : tokens.border,
        }}
      >
        <Animated.View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#fff',
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

export default Toggle;
