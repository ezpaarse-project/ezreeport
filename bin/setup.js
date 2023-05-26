const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const workspaces = require('./workspaces.json');

const Colors = {
  _clear: '\x1b[0m',
  _dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};
const withColor = (str, color) => `${color}${str}${Colors._clear}`;
const rootPath = path.join(__dirname, '..');

// Create ENV
const localEnv = path.join(rootPath, 'ezreeport.local.env.sh');
if (fs.existsSync(localEnv)) {
  console.log(`${withColor(` Skipped creation of "ezreeport.local.env.sh" because it already exists`, Colors.yellow)}`);
} else {
  console.log(`${withColor(`i Creating "ezreeport.local.env.sh"`, Colors.cyan)}`);
  fs.writeFileSync(localEnv, '#!/bin/bash\n\nexport ELASTIC_URL="$ELASTIC_SCHEME://$ELASTIC_HOST:$ELASTIC_PORT"\n\nexport DATABASE_URL="$DATABASE_PROTOCOL://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_DB?schema=default"');
  console.log(`${withColor(' OK', Colors.green)}`);
}

// Install dependencies
const ws = [
  { path: 'package.json' },
  ...workspaces
];
for (const { path: p } of ws) {
  const actualPath = path.join(rootPath, path.dirname(p));
  if (fs.existsSync(path.join(actualPath, 'node_modules'))) {
    console.log(`${withColor(` Skipped "${actualPath}" because "node_modules" exists`, Colors.yellow)}`);
  } else {
    let command = 'npm i';
    if (fs.existsSync(path.join(actualPath, 'package-lock.json'))) {
      command = 'npm ci';
    }

    console.log(`\n${withColor(`i Installing dependencies for "${actualPath}" with "${command}"`, Colors.cyan)}`);
    const stdOut = execSync(command, { cwd: actualPath }).toString();
    const matches = /added (\d+).*audited (\d+).*in (\d+)s.*?(\d+) (?:high severity )?vulnerabilities/gsi.exec(stdOut) ?? [];
    console.log(`${withColor(' OK', Colors.green)} (${withColor(`+${matches[1]}`, Colors.green)}, ${withColor(`!${matches[4]}`, Colors.red)}, ${withColor(`${matches[3]}s`, Colors._dim)})`);
  }
}
