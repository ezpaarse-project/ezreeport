const path = require('node:path');

// https://github.com/pmowrer/semantic-release-monorepo/issues/95#issuecomment-723722912
const packagePath = process.cwd().split(path.sep).slice(-2).join(path.sep);
const pckg = require(`./src/${packagePath}/package.json`);

const configs = {
  // Base configuration
  _: {
    extends: "semantic-release-monorepo",
    tagFormat: pckg.name + '-v${version}',
    ci: false,
    plugins: [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/changelog",
      ["@semantic-release/npm", { npmPublish: false }],
      ["@semantic-release/git", { assets: [`src/${packagePath}/package.json`, `src/${packagePath}/CHANGELOG.md`] }],
      // "@semantic-release/github",
    ],
    branches: [
      "master",
      {
        name: "rc",
        prerelease: "rc",
      },
      {
        name: "dev",
        prerelease: "beta",
      },
    ],
  },

  // ezreeport-report configuration
  'ezreeport-report': (base) => ({
    // TODO: we must bump version into package.json before building (and then push)
    // plugins: [
    //   ...base.plugins,
    //   [
    //     "@semantic-release-plus/docker",
    //     {
    //       skipLogin: true,
    //       registry: process.env.BUILD_DOCKER_REGISTRY ?? 'docker.io',
    //       name: "ezreeport/report:dev",
    //     },
    //   ],
    // ],
  }),

  // ezreeport-mail configuration
  'ezreeport-mail': () => ({
    // TODO: we must bump version into package.json before building (and then push)
    // plugins: [
    //   ...base.plugins,
    //   [
    //     "@semantic-release-plus/docker",
    //     {
    //       skipLogin: true,
    //       registry: process.env.BUILD_DOCKER_REGISTRY ?? 'docker.io',
    //       name: "ezreeport/mail:dev",
    //     },
    //   ],
    // ],
  }),

  // ezreeport-sdk-js configuration
  'ezreeport-sdk-js': () => ({}),

  // ezreeport-vue configuration
  'ezreeport-vue': () => ({}),
}

process.env.GH_TOKEN = process.env.BUILD_GH_TOKEN;

const resolved = configs[pckg.name]?.(configs._);
if(!resolved) {
  throw new Error(`Config "${pckg.name}" (at "${packagePath}") not found.`);
}

module.exports = Object.assign(configs._, resolved);