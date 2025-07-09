export const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  cardBackground: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  separator: '#E5E5EA',
} as const;

export const TYPOGRAPHY = {
  largeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 34,
    lineHeight: 41,
  },
  title1: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    lineHeight: 34,
  },
  title2: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    lineHeight: 28,
  },
  title3: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    lineHeight: 25,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 17,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;