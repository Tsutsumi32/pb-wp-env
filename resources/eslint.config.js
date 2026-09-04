import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['wp-dir/wp-content/themes/*/src/js/_template.js'],
  },
  {
    files: ['wp-dir/wp-content/themes/*/src/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'off',
      'no-irregular-whitespace': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      quotes: ['error', 'single'],
    },
  },
];
