import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
    features: {
        // Rules for module authors
        tooling: true,
        // Rules for formatting
        stylistic: true,
    },
    dirs: {
        src: ['./playground'],
    },
}).append(
    // your custom flat config here...
    {
        rules: {
            // '@typescript-eslint/explicit-module-boundary-types': 'off',
            'no-shadow': 'error',
            'no-unused-labels': 'warn',
            'no-unused-expressions': 'warn',
            'no-duplicate-imports': 'off',
            'no-console': 'off',
            // 'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
            'no-debugger': 'warn',
            '@stylistic/indent': ['off', 4],
            '@stylistic/semi': ['warn', 'always'],
            '@stylistic/operator-linebreak': ['off'],
            '@stylistic/jsx-one-expression-per-line': ['off'],
            '@stylistic/member-delimiter-style': [
                'warn',
                { multiline: { delimiter: 'semi' } },
            ],
            '@stylistic/brace-style': ['warn', '1tbs'],
            '@stylistic/quote-props': ['off'],
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
            // '@typescript-eslint/consistent-type-imports': 'error',
            // '@typescript-eslint/no-unused-vars': [
            //     2,
            //     {
            //         args: 'all',
            //         argsIgnorePattern: '^_',
            //         varsIgnorePattern: '^_',
            //         caughtErrors: 'none',
            //         caughtErrorsIgnorePattern: '^_',
            //     },
            // ],
        },
    },
);
