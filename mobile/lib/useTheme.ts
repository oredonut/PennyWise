import { useColorScheme } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

export interface ThemeTokens {
  bg: string;
  text1: string;
  text2: string;
  text3: string;
  teal: string;
  tealLight: string;
  amber: string;
  amberLight: string;
  danger: string;
  success: string;
  surface: string;
  surfaceTint: string;
  border: string;
  doodle: string;
}

export interface Theme {
  tokens: ThemeTokens;
  fonts: typeof Fonts;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  isDark: boolean;
}

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return {
    tokens: {
      bg:          colors.background,
      text1:       colors.text,
      text2:       colors.textSecondary,
      text3:       isDark ? '#94A3B8' : '#9c9189',
      teal:        colors.primary,
      tealLight:   isDark ? '#134e4a' : '#ccfbf1',
      amber:       colors.warning,
      amberLight:  isDark ? '#451a03' : '#fef3c7',
      danger:      colors.danger,
      success:     colors.accent,
      surface:     isDark ? '#18181b' : '#ffffff',
      surfaceTint: isDark ? '#27272a' : '#f3ede4',
      border:      isDark ? '#3f3f46' : '#e2d9ce',
      doodle:      isDark ? '#3f3f46' : '#c9bfb5',
    },
    fonts: Fonts,
    spacing: Spacing,
    borderRadius: BorderRadius,
    isDark,
  };
}
