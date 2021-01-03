module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'no-console': 'off',
    'import/extensions': [
      'error',
      'always',
      {
        ts: 'never',
      },
    ],
    'import/order': [
      'error',
      {
        groups: [
          'builtin', 'external', 'internal', 'parent', 'sibling', 'index',
        ],
        pathGroups: [{
          pattern: '@src/**',
          group: 'internal',
        }, {
          pattern: '@/**',
          group: 'internal',
        }],
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts'],
      },
      alias: {
        map: [
          ['@src', './src'],
          ['@', './'],
        ],
        extensions: ['.ts', '.json'],
      },
    },
  },
};
