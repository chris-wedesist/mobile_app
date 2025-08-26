import { Platform, StyleSheet } from 'react-native';
import { colors, radius, shadows } from '@/constants/theme';

export const textStyles = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  body: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    color: colors.text.muted,
    lineHeight: 16,
  },
  error: {
    fontSize: 14,
    color: colors.status.error,
    lineHeight: 20,
  }
});

export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  gap20: { gap: 20 },
});

export const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  interactive: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        ':hover': {
          transform: 'translateY(-2px)',
        },
      },
    }),
  },
  selected: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
});

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    ...shadows.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  textSecondary: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  textOutline: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});

export const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 15,
    color: colors.text.primary,
    fontSize: 16,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    color: colors.status.error,
    marginTop: 4,
  },
  icon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
});

export const listStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 15,
    marginBottom: 10,
    ...shadows.sm,
  },
  separator: {
    height: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 10,
  },
});