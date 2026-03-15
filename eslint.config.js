import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
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
        },
    },
    {
        files: ['frontend/mfe/**/*.{ts,tsx,js,jsx}', 'frontend/apps/**/*.{ts,tsx,js,jsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        { name: 'axios', message: 'Use @repo/b2b-services http client or hooks to ensure shared interceptors.' },
                        { name: 'node-fetch', message: 'Use @repo/b2b-services http client or hooks instead of fetch wrappers.' },
                        { name: 'cross-fetch', message: 'Use @repo/b2b-services http client or hooks instead of custom fetch.' },
                    ],
                    patterns: [
                        {
                            group: ['**/services/apiClient', '**/*ApiClient', '**/*HttpClient', '**/api/*'],
                            message: 'Route API calls through @repo/b2b-services to keep consistency and tracing.',
                        },
                    ],
                },
            ],
            'no-restricted-globals': [
                'error',
                { name: 'fetch', message: 'Use @repo/b2b-services http client or provided hooks to keep auth and logging.' },
            ],
        },
    },
);
