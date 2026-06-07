// @ts-nocheck
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface DoodleStarProps {
  color?: string;
  size?: number;
  style?: object;
}

/**
 * PennyWise DoodleStar — hand-drawn 4-pointed star SVG.
 * Matches the web prototype's doodle star cluster on the splash screen.
 */
export function DoodleStar({ color = '#0f766e', size = 20, style }: DoodleStarProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* 4-pointed hand-drawn star */}
        <Path
          d="M12 2 C12.4 6.2 12.8 8.4 14.2 9.8 C15.6 11.2 17.8 11.6 22 12 C17.8 12.4 15.6 12.8 14.2 14.2 C12.8 15.6 12.4 17.8 12 22 C11.6 17.8 11.2 15.6 9.8 14.2 C8.4 12.8 6.2 12.4 2 12 C6.2 11.6 8.4 11.2 9.8 9.8 C11.2 8.4 11.6 6.2 12 2 Z"
          fill={color}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
