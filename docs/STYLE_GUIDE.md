# DESIST Mobile App - Official Style Guide

## 📋 Overview

This document establishes the official design system and style guide for the DESIST mobile application. **All components must follow these guidelines consistently** to ensure a cohesive and professional user experience.

## 🔧 Development Requirements

### **MANDATORY**: Import Theme Constants

All components **MUST** import design tokens from the central theme file:

```typescript
import {
  colors,
  shadows,
  radius,
  typography,
  spacing,
} from '../constants/theme';
```

### **FORBIDDEN**: Hardcoded Values

❌ **Never use hardcoded values** for:

- Colors (e.g., `#FFFFFF`, `black`, `red`)
- Fonts (e.g., `'Arial'`, `'System'`)
- Shadows (e.g., `shadowColor: '#000'`)
- Border radius (e.g., `borderRadius: 8`)
- Spacing (e.g., `margin: 16`)

✅ **Always use theme tokens**:

```typescript
// ✅ CORRECT
backgroundColor: colors.background
color: colors.text.primary
fontFamily: typography.fontFamily.regular
...shadows.medium
borderRadius: radius.medium
padding: spacing.md

// ❌ WRONG
backgroundColor: '#FFFFFF'
color: 'black'
fontFamily: 'Arial'
shadowColor: '#000'
borderRadius: 8
padding: 16
```

## 🎨 Color System

### Primary Colors

- **Primary**: `colors.primary` (#007AFF) - Main brand color
- **Secondary**: `colors.secondary` (#5856D6) - Supporting brand color
- **Accent**: `colors.accent` (#FF6B6B) - Highlight and CTA color

### Semantic Colors

- **Success**: `colors.success` (#34C759)
- **Warning**: `colors.warning` (#FF9500)
- **Error**: `colors.error` (#FF3B30)

### Background Colors

- **Background**: `colors.background` (#FFFFFF) - Main background
- **Surface**: `colors.surface` (#F2F2F7) - Cards, containers

### Text Colors

- **Primary Text**: `colors.text.primary` (#000000)
- **Secondary Text**: `colors.text.secondary` (#8E8E93)
- **Muted Text**: `colors.text.muted` (#C7C7CC)

### Border & Shadow

- **Border**: `colors.border` (#C6C6C8)
- **Shadow**: `colors.shadow` (#000000)

## 📝 Typography

### Font Family

**Inter** is the official font family for the DESIST app:

- **Regular**: `typography.fontFamily.regular` ('Inter-Regular')
- **Medium**: `typography.fontFamily.medium` ('Inter-Medium')
- **SemiBold**: `typography.fontFamily.semiBold` ('Inter-SemiBold')
- **Bold**: `typography.fontFamily.bold` ('Inter-Bold')

### Font Sizes

- **Display**: `typography.fontSize.display` (32px)
- **Title**: `typography.fontSize.title` (24px)
- **Heading**: `typography.fontSize.heading` (20px)
- **Subheading**: `typography.fontSize.subheading` (18px)
- **Body**: `typography.fontSize.body` (16px)
- **Small**: `typography.fontSize.small` (14px)
- **Caption**: `typography.fontSize.caption` (12px)

### Font Weights

- **Light**: `typography.fontWeight.light` ('300')
- **Regular**: `typography.fontWeight.regular` ('400')
- **Medium**: `typography.fontWeight.medium` ('500')
- **SemiBold**: `typography.fontWeight.semiBold` ('600')
- **Bold**: `typography.fontWeight.bold` ('700')
- **Black**: `typography.fontWeight.black` ('800')

## 🎭 Shadows

### Shadow Variants

- **Small**: `shadows.small` - Subtle elevation
- **Medium**: `shadows.medium` - Standard cards
- **Large**: `shadows.large` - Modals, important elements

### Usage

```typescript
// Apply shadow using spread operator
cardStyle: {
  backgroundColor: colors.background,
  ...shadows.medium,
}
```

## 🔲 Border Radius

### Radius Scale

- **Small**: `radius.small` (4px)
- **Medium**: `radius.medium` (8px)
- **Large**: `radius.large` (12px)
- **X-Large**: `radius.xlarge` (16px)
- **Round**: `radius.round` (999px) - Perfect circles

### Aliases

- **MD**: `radius.md` (8px) - Same as medium
- **LG**: `radius.lg` (12px) - Same as large

## 📏 Spacing System

### Spacing Scale

- **XS**: `spacing.xs` (4px)
- **SM**: `spacing.sm` (8px)
- **MD**: `spacing.md` (16px)
- **LG**: `spacing.lg` (24px)
- **XL**: `spacing.xl` (32px)
- **XXL**: `spacing.xxl` (48px)

### Usage

```typescript
container: {
  padding: spacing.md,
  marginBottom: spacing.lg,
}
```

## 🧩 Component Guidelines

### Cards

```typescript
cardStyle: {
  backgroundColor: colors.background,
  borderRadius: radius.medium,
  padding: spacing.md,
  ...shadows.medium,
}
```

### Buttons

```typescript
// Primary Button
primaryButton: {
  backgroundColor: colors.primary,
  borderRadius: radius.medium,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  ...shadows.small,
}

// Secondary Button
secondaryButton: {
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.medium,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
}
```

### Text Styles

```typescript
// Title Text
titleText: {
  fontSize: typography.fontSize.title,
  fontFamily: typography.fontFamily.bold,
  color: colors.text.primary,
  fontWeight: typography.fontWeight.bold,
}

// Body Text
bodyText: {
  fontSize: typography.fontSize.body,
  fontFamily: typography.fontFamily.regular,
  color: colors.text.primary,
  fontWeight: typography.fontWeight.regular,
}
```

## 🔒 Security-Specific Colors

### Status Indicators

- **Secure/Active**: `colors.success` (#34C759)
- **Warning/Caution**: `colors.warning` (#FF9500)
- **Danger/Error**: `colors.error` (#FF3B30)
- **Neutral/Inactive**: `colors.text.secondary` (#8E8E93)

### Mode Indicators

- **Normal Mode**: `colors.primary` (#007AFF)
- **Stealth Mode**: `colors.success` (#34C759)
- **Emergency Mode**: `colors.error` (#FF3B30)

## 📱 Platform Considerations

### iOS Specific

- Use `paddingTop: Platform.OS === 'ios' ? 44 : 0` for status bar
- Leverage iOS native shadow properties

### Android Specific

- Use `elevation` property for shadows
- Account for Android status bar differences

## 🔄 Version Control

### Style Guide Updates

1. All style changes must be documented in this guide
2. Update version number and changelog
3. Notify all developers of changes
4. Review existing components for compliance

### Breaking Changes

- Major color palette changes require full app review
- Typography changes must be tested across all screens
- Shadow/radius changes should be validated on all platforms

## ✅ Compliance Checklist

Before merging any PR, ensure:

- [ ] No hardcoded colors used
- [ ] No hardcoded fonts used
- [ ] All shadows use theme tokens
- [ ] Border radius uses theme scale
- [ ] Spacing follows established system
- [ ] Typography follows established hierarchy
- [ ] New components follow established patterns

## 🛠️ Implementation Examples

### ✅ CORRECT Implementation

```typescript
import { StyleSheet } from 'react-native';
import {
  colors,
  shadows,
  radius,
  typography,
  spacing,
} from '../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.medium,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  title: {
    fontSize: typography.fontSize.heading,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.medium,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
});
```

### ❌ INCORRECT Implementation

```typescript
// DON'T DO THIS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // ❌ Hardcoded color
    padding: 16, // ❌ Hardcoded spacing
  },
  card: {
    backgroundColor: 'white', // ❌ Hardcoded color
    borderRadius: 8, // ❌ Hardcoded radius
    padding: 16, // ❌ Hardcoded spacing
    shadowColor: '#000', // ❌ Hardcoded shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
  },
  title: {
    fontSize: 20, // ❌ Hardcoded size
    fontFamily: 'System', // ❌ Wrong font
    color: 'black', // ❌ Hardcoded color
  },
});
```

## 📞 Contact & Support

For questions about this style guide or design system implementation:

- **Technical Lead**: Review theme constants in `/constants/theme.ts`
- **Design System**: All tokens centrally managed
- **Documentation**: Keep this guide updated with any changes

---

**Last Updated**: Phase 2 Implementation (August 2025)
**Version**: 2.0.0
**Status**: ACTIVE - Mandatory for all development
