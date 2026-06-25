export const Colors = {
  bg: '#faf7f2',
  surface: '#ffffff',
  surfaceTint: '#f3ede4',
  border: '#e2d9ce',
  text1: '#1a1714',
  text2: '#6b6157',
  text3: '#a89e95',
  teal: '#0f766e',
  tealLight: '#ccfbf1',
  amber: '#d97706',
  amberLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  success: '#16a34a',
  successLight: '#dcfce7',
  doodle: '#c9bfb5',
  // Documented translucent overlays (≈25% alpha, the old ad-hoc `+ '40'`).
  // Used for subtle fills like the inactive weekday strip / badge tiles.
  tealLightOverlay: '#ccfbf140',
  surfaceTintOverlay: '#f3ede440',
} as const;

// Warm dark mode — never cold grey. bg #0f0e0c per design spec.
// teal / amber / danger / success are unchanged across modes so the
// Discipline-Score amber and brand teal stay constant.
export const ColorsDark = {
  bg: '#0f0e0c',
  surface: '#1c1a17',
  surfaceTint: '#252219',
  border: '#302c26',
  text1: '#f5ede4',
  text2: '#9e9086',
  text3: '#5c5249',
  teal: '#0f766e',
  tealLight: '#0d3330',
  amber: '#d97706',
  amberLight: '#2a1f0a',
  danger: '#dc2626',
  dangerLight: '#2a0f0f',
  success: '#16a34a',
  successLight: '#0a2a14',
  doodle: '#3d3730',
  // Dark-mode counterparts of the translucent overlays (≈25% alpha).
  tealLightOverlay: '#0d333040',
  surfaceTintOverlay: '#25221940',
} as const;

// Structural token type both palettes satisfy (keys identical, values = hex strings).
export type ColorTokens = { [K in keyof typeof Colors]: string };

export const Radius = {
  sm: 8, md: 14, lg: 20, xl: 28, pill: 999,
} as const;

export const FontFamily = {
  display: 'BricolageGrotesque_700Bold',
  displayXBold: 'BricolageGrotesque_800ExtraBold',
  body: 'PlusJakartaSans_400Regular',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
} as const;
