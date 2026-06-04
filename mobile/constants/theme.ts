/**
 * PennyWise Design System – Colors, Fonts, Spacing & Radius
 *
 * Color palette:
 *   Primary    Teal           #0D9488
 *   Accent     Emerald Green  #22C55E
 *   Background Warm Off-White #F7F6F2
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
  /** Teal – primary actions, CTAs, active nav, score ring */
  primary: '#0D9488',
  /** Teal Light – badge/pill tinted backgrounds */
  tealLight: '#CCFBF1',
  /** Teal Border – subtle teal outlines */
  tealBorder: 'rgba(13,148,136,0.20)',
  /** Emerald Green – success, income, positive deltas */
  accent: '#22C55E',
  /** Warm Off-White – page background */
  backgroundLight: '#F7F6F2',
  /** Soft Gray – cards, surfaces, input backgrounds */
  surface: '#E2E8F0',
  /** Dark Slate – primary body text */
  slate: '#0F172A',
  /** Amber – warnings, budget threshold alerts */
  warning: '#F59E0B',
  /** Amber Light – score pill backgrounds */
  amberLight: '#FEF3C7',
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
    /** Page / screen background — Warm Off-White */
    background: Palette.backgroundLight,
    /** Card / element background — Soft Gray */
    backgroundElement: Palette.surface,
    /** Selected / pressed element background */
    backgroundSelected: '#CBD5E1',
    /** Muted / secondary text */
    textSecondary: '#475569',
    /** Primary brand colour — Teal */
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
    /** Page background — pure dark */
    background: '#0D0D10',
    /** Card / element background */
    backgroundElement: '#18181B',
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
export const Fonts = {
  /** Plus Jakarta Sans ExtraBold – headings, score display, wordmark */
  display: 'PlusJakartaSans_800ExtraBold',
  /** DM Sans Regular – body text, UI labels */
  body: 'DMSans_400Regular',
  /** DM Sans Medium – monospaced fallback until DM Mono is installed */
  mono: 'DMSans_500Medium',
} as const;

// ---------------------------------------------------------------------------
// Spacing scale  (multiples of 4)
// ---------------------------------------------------------------------------
export const Spacing = {
  // Numeric scale (legacy)
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  // Named scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Border Radius tokens
// ---------------------------------------------------------------------------
export const BorderRadius = {
  sm: 6,    // tags, badges, category icons
  md: 10,   // buttons, inputs, warning toasts
  lg: 14,   // cards
  xl: 18,   // score card, bottom sheets
  full: 999, // pills, progress bars, FAB
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
