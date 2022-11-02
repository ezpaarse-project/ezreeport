module.exports = {
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
    project: 'tests/tsconfig.json',
  },
  rules: {
    "import/extensions": "off"
  },
};