const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const Colors = {
  _clear: '\x1b[0m',
  _dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};
const withColor = (str, color) => `${color}${str}${Colors._clear}`;

const localEnv = path.join(__dirname, 'ezreeport.local.env.sh');
if (!fs.existsSync(localEnv)) {
  console.log(`${withColor(`i Creating "ezreeport.local.env.sh"`, Colors.cyan)}`);
  fs.writeFileSync(localEnv, '#!/bin/bash\n\nexport ELASTIC_URL="$ELASTIC_SCHEME://$ELASTIC_HOST:$ELASTIC_PORT"\n\nexport DATABASE_URL="$DATABASE_PROTOCOL://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_DB?schema=default"');
  console.log(`${withColor(' OK', Colors.green)}`);
}

console.log(`\n${withColor(`i Installing dependencies`, Colors.cyan)}`);
const stdOut = execSync('npm ci').toString();
const matches = /added (\d+).*audited (\d+).*in (\d+)s.*?(\d+) (?:high severity )?vulnerabilities/gsi.exec(stdOut) ?? [];
console.log(`${withColor(' OK', Colors.green)} (${withColor(`+${matches[1]}`, Colors.green)}, ${withColor(`!${matches[4]}`, Colors.red)}, ${withColor(`${matches[3]}s`, Colors._dim)})`);
