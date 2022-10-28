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
    project: 'src/report/tsconfig.json',
  },
  rules: {
    "import/extensions": "off",
    "@typescript-eslint/comma-dangle": ['error', {
      // Defaulting to airbnb config
      arrays: 'always-multiline',
      objects: 'always-multiline',
      exports: 'always-multiline',
      functions: 'always-multiline',
      enums: 'always-multiline',
      generics: 'always-multiline',
      tuples: 'always-multiline',
      // Expect for imports, because it conflict with VSCode
      imports: 'never',
    }],
    "@typescript-eslint/no-explicit-any": "warn"
  },
};
