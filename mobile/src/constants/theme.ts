export const colors = {
  brand: {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    secondary: '#F59E0B',
    secondaryHover: '#D97706',
    accent: '#10B981',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    white: '#ffffff',
  },
  auth: {
    bg: '#1a2f23',
    bgDeep: '#142219',
    golden: '#E4B643',
    goldenDark: '#C99A2E',
    cream: '#f5f5dc',
    bgGlass: 'rgba(255, 255, 255, 0.06)',
    borderGlass: 'rgba(255, 255, 255, 0.12)',
    borderGlassFocus: 'rgba(228, 182, 67, 0.5)',
    textOnDark: '#fff',
    textMuted: 'rgba(255, 255, 255, 0.55)',
  },
  text: {
    primary: '#111827',
    heading: '#1F2937',
    secondary: '#6B7280',
    subtle: '#9CA3AF',
    placeholder: '#9CA3AF',
    input: '#1F2937',
    inverse: '#ffffff',
  },
  surface: {
    white: '#ffffff',
    warm: '#F9FAFB',
    input: '#ffffff',
  },
  border: {
    default: '#E5E7EB',
    focus: '#2563EB',
    error: '#EF4444',
  },
  status: {
    error: '#EF4444',
    errorBg: '#FEE2E2',
    errorDark: '#DC2626',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    success: '#10B981',
    successBg: '#D1FAE5',
    successDark: '#059669',
    info: '#3B82F6',
  },
  password: {
    weak: '#EF4444',
    medium: '#F59E0B',
    strong: '#10B981',
  },
  offline: {
    banner: '#EF4444',
    reconnected: '#10B981',
  },
} as const;

export const typography = {
  title: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.96 },
  subtitle: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600' as const },
  input: { fontSize: 15 },
  body: { fontSize: 15, lineHeight: 22 },
  button: { fontSize: 16, fontWeight: '700' as const },
  link: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  pill: 100,
} as const;

export const shadows = {
  button: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export type ThemeColors = typeof colors;
