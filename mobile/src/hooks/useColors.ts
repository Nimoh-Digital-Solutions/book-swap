import { useThemeStore } from '@/stores/themeStore';

export function useColors() {
  return useThemeStore((s) => s.themedColors);
}

export function useIsDark() {
  return useThemeStore((s) => s.isDark);
}
