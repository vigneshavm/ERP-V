import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist', 'coverage', 'node_modules', 'apps', 'budget-planner-api'] },
    {
        files: ['**/*.{ts,js}'],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
            // `declare global { namespace Express { interface Request {...} } }` is the standard,
            // TypeScript-recommended way to augment Express's ambient Request type — there is no
            // ES-module alternative for this specific pattern, so allow ambient/declared namespaces
            // while still flagging namespaces used as a plain code-organization mechanism.
            '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
        },
    },
);
