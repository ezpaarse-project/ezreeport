module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:vue/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  overrides: [
    {
      files: ['example/layouts/**/*.vue', 'example/pages/**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
    {
      files: ['example/**/*', '**/*.story.vue', 'vite.config.ts', 'histoire.setup.ts', 'plugins/**/*.ts'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: 'src/vue/tsconfig.eslint.json',
    extraFileExtensions: ['.vue'],
  },
  plugins: [
    'vue',
    '@typescript-eslint',
    'import',
  ],
  rules: {
    'import/no-cycle': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: 'src/vue/',
      },
    },
  },
};
