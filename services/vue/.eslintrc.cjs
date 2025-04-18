require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  env: {
    es2024: true,
    browser: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-airbnb-with-typescript',
    'plugin:storybook/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: 'tsconfig.eslint.json',
  },
  rules: {
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
    'vue/multi-word-component-names': 'off',
  },
};
