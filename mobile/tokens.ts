export const Colors = {
  bg: '#f5f7f9',
  surface: '#ffffff',
  surfaceTint: '#eef0f3',
  border: '#e2e5e9',
  borderStrong: '#c8cdd4',
  text1: '#111318',
  text2: '#4a5060',
  text3: '#8a919e',
  teal: '#0f766e',
  tealLight: '#ccfbf1',
  amber: '#d97706',
  amberLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  success: '#16a34a',
  successLight: '#dcfce7',
  doodle: '#c9bfb5',
} as const;

// Warm dark mode — never cold grey. bg #0f0e0c per design spec.
// teal / amber / danger / success are unchanged across modes so the
// Discipline-Score amber and brand teal stay constant.
export const ColorsDark = {
  bg: '#0f0e0c',
  surface: '#1c1a17',
  surfaceTint: '#252219',
  border: '#302c26',
  borderStrong: '#2a2825',
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
