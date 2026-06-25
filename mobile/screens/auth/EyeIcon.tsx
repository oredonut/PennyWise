// Feather-style eye / eye-off icons (stroke SVG, 24×24 viewBox) — matches the
// inline-SVG icon convention used elsewhere in the app (e.g. Chevron/Pencil in
// TxnDetailScreen). Replaces the 👁/🙈 emoji on the password fields.
import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';

export function EyeIcon({ off, color, size = 20 }: { off: boolean; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {off ? (
        <>
          <Path
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1={1} y1={1} x2={23} y2={23} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <Path
            d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </Svg>
  );
}
