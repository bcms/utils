import tseslint from 'typescript-eslint';

export default [
    ...tseslint.configs.recommended,
    {
        files: [
            'src/**/*.{js,mjs,cjs,ts,tsx}',
            'test/**/*.{js,mjs,cjs,ts,tsx}',
        ],
        rules: {
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            'no-shadow': 'error',
            'no-unused-labels': 'warn',
            'no-unused-expressions': 'warn',
            'no-duplicate-imports': 'off',
            'no-console': 'off',
            // 'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
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
                    caughtErrors: 'none',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
        },
    },
    {
        ignores: ['./node_modules/*', './dist/*', './docs/*', './bcms/*'],
    },
];
