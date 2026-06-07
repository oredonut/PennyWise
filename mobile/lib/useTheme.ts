import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => Promise<void>;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

const THEME_STORAGE_KEY = '@pennywise_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedMode) => {
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setThemeModeState(savedMode);
      }
    });
  }, []);

  const setThemeMode = async (mode: 'light' | 'dark' | 'system') => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const theme: Theme = {
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
    themeMode,
    setThemeMode,
  };

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Fallback if not wrapped in ThemeProvider
    const systemColorScheme = useColorScheme();
    const isDark = systemColorScheme === 'dark';
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
      themeMode: 'system',
      setThemeMode: async () => {},
    };
  }
  return context;
}
