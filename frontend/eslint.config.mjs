import nextPlugin from 'eslint-config-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  ...nextPlugin(),
  {
    rules: {
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2],
      'indent': ['error', 2, { SwitchCase: 1 }]
    }
  }
];

export default config;
