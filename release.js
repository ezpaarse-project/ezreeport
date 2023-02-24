const multirelease = require("multi-semantic-release");
const path = require('node:path');

multirelease(
  [
    path.join(__dirname, `src/sdk/package.json`),
    path.join(__dirname, `src/vue/package.json`),
    path.join(__dirname, `src/services/mail/package.json`),
    path.join(__dirname, `src/services/report/package.json`),
  ],
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
