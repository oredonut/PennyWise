/**
 * PennyWise Design System – Colors, Fonts & Spacing
 *
 * Color palette:
 *   Primary    Deep Teal      #0F766E
 *   Accent     Emerald Green  #22C55E
 *   Background Off White      #F8FAFC
 *   Surface    Soft Gray      #E2E8F0
 *   Text       Dark Slate     #0F172A
 *   Warning    Amber          #F59E0B
 *   Danger     Soft Red       #EF4444
 */

import '@/global.css';

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Raw Brand Palette
// Use these when you need a colour that is not dependent on light/dark mode
// (e.g. always-on status badges, charts, illustrations).
// ---------------------------------------------------------------------------
export const Palette = {
  /** Deep Teal – primary actions, CTAs, active nav */
  primary: '#0F766E',
  /** Emerald Green – success, income, positive deltas */
  accent: '#22C55E',
  /** Off White – page background */
  backgroundLight: '#F8FAFC',
  /** Soft Gray – cards, surfaces, input backgrounds */
  surface: '#E2E8F0',
  /** Dark Slate – primary body text */
  slate: '#0F172A',
  /** Amber – warnings, budget threshold alerts */
  warning: '#F59E0B',
  /** Soft Red – expenses, overspend, danger states */
  danger: '#EF4444',
} as const;

// ---------------------------------------------------------------------------
// Theme-aware Colors  (consumed by useTheme / ThemedView / ThemedText)
// ---------------------------------------------------------------------------
export const Colors = {
  light: {
    /** Primary body text — Dark Slate */
    text: Palette.slate,
    /** Page / screen background — Off White */
    background: Palette.backgroundLight,
    /** Card / element background — Soft Gray */
    backgroundElement: Palette.surface,
    /** Selected / pressed element background */
    backgroundSelected: '#CBD5E1',
    /** Muted / secondary text */
    textSecondary: '#475569',
    /** Primary brand colour — Deep Teal */
    primary: Palette.primary,
    /** Accent colour — Emerald Green */
    accent: Palette.accent,
    /** Warning colour — Amber */
    warning: Palette.warning,
    /** Danger / expense colour — Soft Red */
    danger: Palette.danger,
  },
  dark: {
    /** Primary body text */
    text: '#F1F5F9',
    /** Page background — deep teal-navy */
    background: '#0A1628',
    /** Card / element background */
    backgroundElement: '#132032',
    /** Selected / pressed element background */
    backgroundSelected: '#1E3448',
    /** Muted / secondary text */
    textSecondary: '#94A3B8',
    /** Primary brand colour — slightly lighter teal for dark mode */
    primary: '#14B8A6',
    /** Accent colour — Emerald Green */
    accent: Palette.accent,
    /** Warning colour — Amber */
    warning: Palette.warning,
    /** Danger / expense colour — Soft Red */
    danger: Palette.danger,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// ---------------------------------------------------------------------------
// Spacing scale  (multiples of 4)
// ---------------------------------------------------------------------------
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
