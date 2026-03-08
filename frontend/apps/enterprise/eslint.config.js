import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tzeslint from 'typescript-eslint'

export default tzeslint.config(
  {
    ignores: ['dist', 'node_modules', '.turbo', 'dist_backup'],
  },
  {
    // Extend configurations
    extends: [
      js.configs.recommended,
      ...tzeslint.configs.recommended,
    ],
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // Resolve conflicts between base ESLint and TypeScript-ESLint
      'no-unused-vars': 'off', 
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^[A-Z_]',
        ignoreRestSiblings: true 
      }],

      // Relax some strict rules for existing codebase to reduce initial noise
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-debugger': 'warn',
      
      // Project specific preferences
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
)
