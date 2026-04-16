import { colors as lightColors } from '@/constants/theme';
import { darkColors } from '@/constants/darkColors';

jest.mock('react-native', () => ({
  Appearance: { getColorScheme: jest.fn(() => 'light') },
  Platform: { OS: 'ios', select: jest.fn((obj: { ios?: unknown }) => obj.ios) },
}));

import { useThemeStore } from '@/stores/themeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({
      mode: 'system',
      systemScheme: 'light',
      isDark: false,
      themedColors: lightColors,
    });
  });

  it('default mode is system', () => {
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it("setMode('dark') sets isDark to true", () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().isDark).toBe(true);
    expect(useThemeStore.getState().themedColors).toEqual(darkColors as typeof lightColors);
  });

  it("setMode('light') sets isDark to false", () => {
    useThemeStore.getState().setMode('dark');
    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().isDark).toBe(false);
    expect(useThemeStore.getState().themedColors).toEqual(lightColors);
  });

  it("setSystemScheme('dark') with mode 'system' sets isDark to true", () => {
    useThemeStore.setState({ mode: 'system', systemScheme: 'light', isDark: false, themedColors: lightColors });
    useThemeStore.getState().setSystemScheme('dark');
    expect(useThemeStore.getState().isDark).toBe(true);
  });

  it("setSystemScheme('dark') with mode 'light' keeps isDark false", () => {
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().setSystemScheme('dark');
    expect(useThemeStore.getState().isDark).toBe(false);
  });
});
