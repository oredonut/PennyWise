// @ts-nocheck
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface ScribbleLayerProps {
  color?: string;
}

/**
 * PennyWise ScribbleLayer
 *
 * Design rules:
 *   • Positioned absolute, full-bleed (top/right/bottom/left = 0)
 *   • z-index 0 — always behind content
 *   • pointer-events none — never intercepts touches
 *   • opacity 0.06 — very subtle, paper-texture feel
 *   • Absent on BottomSheets and modals
 */
export function ScribbleLayer({ color = '#0f766e' }: ScribbleLayerProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Top-left corner squiggle */}
        <Path
          d="M-10 80 C20 60, 60 90, 40 120 C20 150, 60 160, 80 140"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 8"
        />

        {/* Top-right doodle arc */}
        <Path
          d="M320 20 C350 10, 390 40, 380 70 C370 90, 400 100, 390 130"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="1 7"
        />

        {/* Mid-left wavy line */}
        <Path
          d="M0 380 C30 360, 60 400, 30 420 C10 435, 40 460, 20 480"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray="2 6"
        />

        {/* Bottom-right corner scribble */}
        <Path
          d="M340 760 C360 740, 400 760, 390 790 C380 810, 410 820, 400 844"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 8"
        />

        {/* Bottom-left arc */}
        <Path
          d="M0 720 C20 700, 60 720, 50 750 C40 770, 70 780, 60 810"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray="1 6"
        />

        {/* Scattered small crosses / plus marks */}
        <Path d="M310 180 L310 196 M302 188 L318 188" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M70 600 L70 612 M64 606 L76 606"   stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        <Path d="M200 50 L200 60 M195 55 L205 55"   stroke={color} strokeWidth="1.2" strokeLinecap="round" />

        {/* Small doodle circles */}
        <Circle cx="360" cy="400" r="6"  stroke={color} strokeWidth="1.4" fill="none" strokeDasharray="2 4" />
        <Circle cx="28"  cy="260" r="4"  stroke={color} strokeWidth="1.2" fill="none" strokeDasharray="1 3" />
        <Circle cx="195" cy="800" r="5"  stroke={color} strokeWidth="1.3" fill="none" strokeDasharray="2 4" />

        {/* Loose dotted diagonal lines (paper texture) */}
        <Path d="M0 0 L30 30"   stroke={color} strokeWidth="1"   strokeLinecap="round" strokeDasharray="1 9" />
        <Path d="M390 0 L360 30" stroke={color} strokeWidth="1"  strokeLinecap="round" strokeDasharray="1 9" />
        <Path d="M0 844 L30 814" stroke={color} strokeWidth="1"  strokeLinecap="round" strokeDasharray="1 9" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:  'absolute',
    top:       0,
    left:      0,
    right:     0,
    bottom:    0,
    zIndex:    0,
    opacity:   0.06,
  },
});
