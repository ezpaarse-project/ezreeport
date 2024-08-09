module.exports = {
  $schema: 'https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/semantic-release.json',
  extends: [
    'semantic-release-config',
  ],
  ci: false,
  tagFormat: `${process.env.PNPM_PACKAGE_NAME}@\${version}`,
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    ['@semantic-release/npm', { npmPublish: false }],
    ['@semantic-release/git', { assets: ['package.json', 'CHANGELOG.md'] }],
  ],
  branches: [
    'master',
    {
      name: 'rc/*',
      prerelease: 'rc',
    },
    {
      name: 'dev',
      prerelease: 'beta',
    },
  ],
};
