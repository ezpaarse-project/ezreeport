module.exports = {
  root: false,
  parserOptions: {
    project: 'tsconfig.eslint.json',
  },
  env: {
    browser: true,
  },
  overrides: [
    {
      files: ['vite.config.mts', 'tsup.config.ts'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
