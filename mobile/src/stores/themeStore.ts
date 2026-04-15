import { create } from 'zustand';
import { Appearance, ColorSchemeName, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors as lightColors } from '@/constants/theme';
import { darkColors } from '@/constants/darkColors';

export type AppearanceMode = 'system' | 'light' | 'dark';

type ThemeColors = typeof lightColors;

interface ThemeState {
  mode: AppearanceMode;
  systemScheme: ColorSchemeName;
  isDark: boolean;
  themedColors: ThemeColors;
  setMode: (mode: AppearanceMode) => void;
  setSystemScheme: (scheme: ColorSchemeName) => void;
}

const STORAGE_KEY = 'ui_appearance_mode';

function readPersistedMode(): AppearanceMode {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
      return 'system';
    }
    const raw = SecureStore.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // ignore
  }
  return 'system';
}

function persistMode(mode: AppearanceMode) {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY, mode);
    } else {
      SecureStore.setItem(STORAGE_KEY, mode);
    }
  } catch {
    // ignore
  }
}

function resolveIsDark(mode: AppearanceMode, systemScheme: ColorSchemeName): boolean {
  if (mode === 'light') return false;
  if (mode === 'dark') return true;
  return systemScheme === 'dark';
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const systemScheme = Appearance.getColorScheme();
  const mode = readPersistedMode();
  const isDark = resolveIsDark(mode, systemScheme);

  return {
    mode,
    systemScheme,
    isDark,
    themedColors: isDark ? (darkColors as unknown as ThemeColors) : lightColors,
    setMode: (newMode) => {
      persistMode(newMode);
      const { systemScheme } = get();
      const dark = resolveIsDark(newMode, systemScheme);
      set({ mode: newMode, isDark: dark, themedColors: dark ? (darkColors as unknown as ThemeColors) : lightColors });
    },
    setSystemScheme: (scheme) => {
      const { mode } = get();
      const dark = resolveIsDark(mode, scheme);
      set({ systemScheme: scheme, isDark: dark, themedColors: dark ? (darkColors as unknown as ThemeColors) : lightColors });
    },
  };
});
