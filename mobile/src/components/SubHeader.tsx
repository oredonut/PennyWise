// ============================================================
// SubHeader — back affordance + optional title for pushed/drill-down screens.
// Replaces the bare "‹" Text glyphs hand-rolled in OcrScreen, OcrConfirmScreen
// and OtpScreen with a real stroke icon and a 44×44 touch target.
//
// design.md §7 specifies this primitive (back arrow + title row).
//
//   <SubHeader title="Snap receipt" onBack={() => navigation.goBack()} />
//   <SubHeader onBack={() => navigation.goBack()} right={<Image … />} />
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../lib/useTheme';
import { FontFamily } from '../../tokens';

interface SubHeaderProps {
  onBack: () => void;
  title?: string;
  /** Optional trailing content (e.g. a thumbnail or an action). */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SubHeader({ onBack, title, right, style }: SubHeaderProps) {
  const { tokens } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }, style]}>
      {/* 44×44 target; negative margin keeps the icon optically on the gutter. */}
      <TouchableOpacity
        onPress={onBack}
        hitSlop={8}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={tokens.text2}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {title ? (
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontFamily: FontFamily.displayXBold, fontSize: 20, color: tokens.text1, marginLeft: 2 }}
        >
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {right}
    </View>
  );
}

export default SubHeader;
