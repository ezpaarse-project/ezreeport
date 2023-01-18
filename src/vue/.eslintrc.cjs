module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
    browser: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/eslint-config-airbnb-with-typescript',
    'plugin:storybook/recommended',
  ],
  overrides: [
    {
      files: [
        'example/layouts/**/*.vue',
        'example/pages/**/*.vue',
      ],
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
    {
      files: [
        'example/**/*.ts',
        'example/**/*.vue',
        'src/**/*.stories.ts',
        'plugins/**/*.ts',
        '.storybook/**/*.ts',
        'vite.config.ts',
        '.eslintrc.cjs',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: 'tsconfig.eslint.json',
  },
};
