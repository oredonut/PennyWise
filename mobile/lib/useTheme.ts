import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ColorsDark, FontFamily, Radius, ColorTokens } from '../tokens';

// Theme is driven entirely by tokens.ts — the design source of truth.
// (Previously this file hardcoded a stale, off-spec palette via constants/theme.ts.)

export type ThemeTokens = ColorTokens;
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  tokens: ThemeTokens;
  fonts: typeof FontFamily;
  radius: typeof Radius;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

const THEME_STORAGE_KEY = '@pennywise_theme_mode';

function buildTokens(isDark: boolean): ThemeTokens {
  return isDark ? ColorsDark : Colors;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
          setThemeModeState(savedMode);
        }
      })
      .catch(() => {
        // Non-fatal: fall back to system theme if storage is unavailable.
      });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Non-fatal: the in-memory mode still applies for this session.
    }
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';

  const theme: Theme = {
    tokens: buildTokens(isDark),
    fonts: FontFamily,
    radius: Radius,
    isDark,
    themeMode,
    setThemeMode,
  };

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (context) return context;

  // Fallback when used outside a ThemeProvider — read-only, no persistence.
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';
  return {
    tokens: buildTokens(isDark),
    fonts: FontFamily,
    radius: Radius,
    isDark,
    themeMode: 'system',
    setThemeMode: async () => {},
  };
}
