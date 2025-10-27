import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
    globalIgnores(['dist']),
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            reactHooks.configs['recommended-latest'],
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
    },
    {
        files: ['src/**/*.{js,mjs,cjs,ts,tsx}'],
        rules: {
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            'no-shadow': 'error',
            'no-unused-labels': 'error',
            'no-unused-expressions': 'error',
            'no-duplicate-imports': 'off',
            'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
            'no-debugger': 'warn',
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-unused-vars': [
                2,
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
        },
    },
    {
        files: ['src/**/*.{ts,js,tsx}'],
        rules: {
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'variable',
                    format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                    filter: {
                        regex: '^_',
                        match: false,
                    },
                },
                {
                    selector: 'function',
                    format: ['camelCase', 'PascalCase'],
                    filter: {
                        regex: '^_',
                        match: false,
                    },
                },
                {
                    selector: 'parameter',
                    format: ['camelCase', 'PascalCase'],
                    filter: {
                        regex: '^_',
                        match: false,
                    },
                },
                {
                    selector: 'method',
                    format: ['camelCase', 'PascalCase'],
                    filter: {
                        regex: '^_',
                        match: false,
                    },
                },
            ],
        },
    },
]);
