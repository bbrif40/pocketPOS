import { Platform, StyleSheet } from 'react-native';

export const THEME = {
  colors: {
    canvas: '#dce8df', // Calm sage green background
    card: '#f8faf7', // Warm porcelain white card surface
    cardAlt: '#ffffff', // Clean white
    pine: '#17352b', // Deep forest pine (hero / primary text / dark surface)
    pineLight: '#254e40', // Elevated pine
    pineMuted: '#31574a',
    gold: '#f5d67d', // Warm golden honey accent
    goldDark: '#926a15', // Deep gold for contrast text
    seafoam: '#9fc9c0', // Calm soft seafoam
    amber: '#e7ad68', // Warm apricot / warning
    berry: '#bf7782', // Muted berry / expense
    moss: '#638276', // Muted olive moss
    muted: '#637c71', // Muted text
    mutedLight: '#9fb8ad', // Subtle placeholder/labels
    border: '#c8d8cc', // Soft sage border
    borderDashed: '#6e887b', // Expressive dashed border
    white: '#ffffff',
    danger: '#be383b', // Calm brick red
    success: '#2e7d5a', // Natural forest green
  },
  typography: {
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      web: '"DM Serif Display", Georgia, serif',
      default: 'serif',
    }),
    sans: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'normal',
    }),
  },
  radius: {
    hero: 24,
    card: 18,
    button: 14,
    pill: 999,
    input: 12,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
  },
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.canvas,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: THEME.colors.pine,
    borderRadius: THEME.radius.hero,
    padding: 20,
    marginBottom: 16,
  },
  heroOverline: {
    color: THEME.colors.mutedLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroAmount: {
    fontFamily: THEME.typography.serif,
    fontSize: 44,
    color: THEME.colors.white,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: THEME.colors.mutedLight,
    fontSize: 12,
    marginTop: 4,
  },
  goldButton: {
    backgroundColor: THEME.colors.gold,
    borderRadius: THEME.radius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goldButtonText: {
    color: THEME.colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  dashedCard: {
    padding: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: THEME.colors.borderDashed,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: 'rgba(248, 250, 247, 0.6)',
  },
});
