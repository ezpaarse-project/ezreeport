module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  extends: ['airbnb-base', 'airbnb-typescript/base'],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: 'tsconfig.eslint.json',
  },
  rules: {
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
  },
};
