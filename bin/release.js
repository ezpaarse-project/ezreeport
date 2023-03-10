const multirelease = require("multi-semantic-release");
const path = require('node:path');
const workspaces = require('./workspaces.json');

multirelease(
  workspaces
    .filter(({ release }) => !!release)
    .map(({ path: p }) => path.join(__dirname, '..', p)),
  {
    ci: false,
    plugins: [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/changelog",
      ["@semantic-release/npm", { npmPublish: false }],
      ["@semantic-release/git", { assets: ["package.json", "CHANGELOG.md"] }],
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
);
