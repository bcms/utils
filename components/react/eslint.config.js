import tseslint from 'typescript-eslint';

export default [
    ...tseslint.configs.recommended,
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
];
