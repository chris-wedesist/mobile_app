/**
 * ESLint Configuration for DESIST Mobile App (ESLint 9.x)
 *
 * Enforces style guide compliance and code quality standards
 * See /docs/STYLE_GUIDE.md for complete guidelines
 */

import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/ios/**',
      '**/android/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/babel.config.js',
      '**/metro.config.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        __DEV__: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URLSearchParams: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
      },
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      // Style Guide Enforcement
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9A-Fa-f]{3,8}/]',
          message:
            "❌ Hardcoded hex colors are forbidden. Use colors from '../constants/theme' instead.",
        },
        {
          selector:
            'Literal[value=/^(Arial|Helvetica|Times|Georgia|Verdana|System)$/]',
          message:
            "❌ Hardcoded font families are forbidden. Use typography.fontFamily from '../constants/theme' instead.",
        },
      ],

      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1, 2],
          ignoreArrayIndexes: true,
          detectObjects: false,
        },
      ],

      // TypeScript Rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-shadow': ['error'],

      // Style Rules
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-shadow': 'off', // Use TypeScript version instead
      'no-undef': 'off', // TypeScript handles this

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

      // Crypto and Security specific rules
      'no-restricted-globals': [
        'error',
        {
          name: 'btoa',
          message: 'Use expo-crypto for secure encoding instead of btoa',
        },
        {
          name: 'atob',
          message: 'Use expo-crypto for secure decoding instead of atob',
        },
      ],
    },
  },
  {
    files: ['**/test_*.ts', '**/*.test.ts', '**/*.test.tsx', '**/tests/**'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-magic-numbers': 'off',
    },
  },
];
