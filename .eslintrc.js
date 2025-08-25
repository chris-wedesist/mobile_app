/**
 * ESLint Configuration for DESIST Mobile App
 *
 * Enforces style guide compliance and code quality standards
 * See /docs/STYLE_GUIDE.md for complete guidelines
 */

module.exports = {
  extends: [
    'expo',
    '@react-native-community',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    // Style Guide Enforcement
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/#[0-9A-Fa-f]{3,8}/]',
        message:
          "❌ Hardcoded hex colors are forbidden. Use colors from '../constants/theme' instead. See /docs/STYLE_GUIDE.md",
      },
      {
        selector:
          'Literal[value=/^(Arial|Helvetica|Times|Georgia|Verdana|System)$/]',
        message:
          "❌ Hardcoded font families are forbidden. Use typography.fontFamily from '../constants/theme' instead. See /docs/STYLE_GUIDE.md",
      },
    ],
    'no-magic-numbers': [
      'warn',
      {
        ignore: [0, 1, -1, 2],
        ignoreArrayIndexes: true,
        detectObjects: false,
        message:
          'Consider using spacing, radius, or typography constants from theme instead of magic numbers',
      },
    ],

    // TypeScript Rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // React Rules
    'react/prop-types': 'off', // TypeScript handles this
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Style Rules
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',

    // Import Rules
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
      },
    ],

    // Security Rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-eval': 'error',
    'no-implied-eval': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-shadow': ['error'],
        'no-shadow': 'off',
        'no-undef': 'off',
      },
    },
  ],
  env: {
    'react-native/react-native': true,
  },
  settings: {
    'react-native/style-sheet-object-names': ['StyleSheet', 'styles', 'style'],
  },
};
