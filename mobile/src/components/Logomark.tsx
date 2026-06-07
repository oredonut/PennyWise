// ============================================================
// PennyWise — Logomark
//
// The brand mark: ₦ symbol inside a hand-drawn wobbly square.
// The ₦ is rendered with the display font (BricolageGrotesque),
// NOT JetBrains Mono. Mono is reserved for currency *amounts*.
// ============================================================

// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/useTheme';

interface LogomarkProps {
  size?: number;
}

export function Logomark({ size = 72 }: LogomarkProps) {
  const { tokens, fonts } = useTheme();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Wobbly hand-drawn square border */}
      <Svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        width={size}
        height={size}
      >
        <Path
          vectorEffect="non-scaling-stroke"
          fill="none"
          stroke={tokens.teal}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 4 C 30 1.5, 62 2.5, 93 4.2 C 96.5 4.4, 98 7, 97.6 12 C 98.4 38, 97.4 64, 96.3 92 C 96.1 96, 94 98.4, 89 97.7 C 60 98.6, 33 97.8, 8.5 97.2 C 4 97, 2 95, 2.6 90 C 1.8 64, 2.4 36, 3.1 11 C 3 6.5, 4.5 4.4, 7 4 Z"
        />
      </Svg>

      {/* ₦ glyph — display font, not Mono */}
      <Text
        style={[
          styles.symbol,
          {
            fontFamily: fonts.display,
            fontSize:   size * 0.5,
            color:      tokens.teal,
          },
        ]}
        accessibilityLabel="PennyWise"
      >
        ₦
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:        'relative',
    alignItems:      'center',
    justifyContent:  'center',
  },
  symbol: {
    fontWeight:          '800',
    includeFontPadding:  false,
    textAlignVertical:   'center',
  },
});
