import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import';

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  {
    ignores: ['node_modules/**', 'lambda.zip']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    plugins: {
      import: pluginImport
    },
    rules: {
      'indent': ['error', 2, { SwitchCase: 1 }],
      'import/no-default-export': 'error'
    }
  }
];

export default config;
