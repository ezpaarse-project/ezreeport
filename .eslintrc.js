module.exports = {
  root: true,
  env: {
    es2024: true,
    node: true,
  },
  extends: ['airbnb-base', 'airbnb-typescript/base'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  overrides: [],
  rules: {
    'import/extensions': 'off',
    'no-underscore-dangle': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
    }],
  },
};
