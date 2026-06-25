// ============================================================
// SegmentedControl — one shared implementation for the app's segmented
// pickers. Replaces the inline expense/income toggle in AddTransaction and
// the 7d/30d range tabs in InsightsView.
//
// Pill radius + teal active state per design.md §4/§5 (segmented controls use
// --r-pill). Active label is white on teal (teal is constant across themes,
// so a fixed light label is always correct).
//
//   <SegmentedControl
//     options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]}
//     value={activeType}
//     onChange={setActiveType}
//     fullWidth
//   />
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../../lib/useTheme';
import { FontFamily, Radius } from '../../tokens';

export type SegmentOption<T extends string> = { value: T; label: string };

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Stretch segments to fill the row (forms). Default: content-width (compact). */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fullWidth = false,
  style,
}: SegmentedControlProps<T>) {
  const { tokens } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: tokens.surfaceTint,
          borderRadius: Radius.pill,
          padding: 3,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.85}
            style={{
              flex: fullWidth ? 1 : undefined,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              paddingHorizontal: fullWidth ? 0 : 14,
              borderRadius: Radius.pill,
              backgroundColor: active ? tokens.teal : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: active ? FontFamily.bodySemiBold : FontFamily.body,
                fontSize: 13,
                color: active ? '#fff' : tokens.text2,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default SegmentedControl;
