import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactNativePlugin from 'eslint-plugin-react-native';
import prettierConfig from 'eslint-config-prettier'; // Import the config object

export default [
    // Base ESLint recommended rules
    js.configs.recommended,

    // TypeScript Configuration
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
                project: './tsconfig.json', // Link to your tsconfig
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            // Apply recommended TypeScript rules
            ...tseslint.configs.recommended.rules,
            // Add any specific TS overrides here
        },
    },

    // React & React Native Configuration
    {
        files: ['**/*.{js,jsx,ts,tsx}'], // Apply to all relevant files
        plugins: {
            react: reactPlugin,
            'react-native': reactNativePlugin,
        },
        languageOptions: {
            // Ensure JSX is enabled if not covered by TS parserOptions
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        rules: {
            // Manually add essential React rules (subset of recommended)
            'react/display-name': 'warn',
            'react/jsx-key': 'warn',
            'react/jsx-no-comment-textnodes': 'warn',
            'react/jsx-no-duplicate-props': 'warn',
            'react/jsx-no-target-blank': 'warn',
            'react/jsx-no-undef': 'error',
            'react/jsx-uses-react': 'warn', // Or 'off' if using new JSX transform
            'react/jsx-uses-vars': 'warn',
            'react/no-children-prop': 'warn',
            'react/no-danger-with-children': 'warn',
            'react/no-deprecated': 'warn',
            'react/no-direct-mutation-state': 'warn',
            'react/no-find-dom-node': 'warn',
            'react/no-is-mounted': 'warn',
            'react/no-render-return-value': 'error',
            'react/no-string-refs': 'warn',
            'react/no-unescaped-entities': 'warn',
            'react/no-unknown-property': 'warn',
            'react/prop-types': 'off', // Often off in TS projects
            'react/react-in-jsx-scope': 'off', // Often off with new JSX transform
            'react/require-render-return': 'error',

            // Manually add essential React Native rules (subset of 'all')
            'react-native/no-unused-styles': 'warn',
            'react-native/split-platform-components': 'warn', // Example rule
            'react-native/no-inline-styles': 'warn', // Example rule
            'react-native/no-color-literals': 'off', // Example rule (often disabled)
            'react-native/no-raw-text': 'warn', // Example rule
            // Add more specific RN rules as needed here...
        },
        settings: {
            react: {
                version: 'detect', // Automatically detect React version
            },
        },
    },

    // Prettier Configuration (ensure it's last)
    // Apply Prettier rules by including its config object directly
    prettierConfig,
];
