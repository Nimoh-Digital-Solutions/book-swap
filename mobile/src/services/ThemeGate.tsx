import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';

/**
 * When the OS color scheme changes, update the theme store so "system" mode stays accurate.
 */
export function ThemeGate(): null {
  const setSystemScheme = useThemeStore((s) => s.setSystemScheme);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, [setSystemScheme]);

  return null;
}
