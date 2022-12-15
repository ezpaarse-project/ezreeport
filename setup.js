const fs = require('node:fs');
const path = require('node:path')
const { execSync } = require('node:child_process')

const localEnv = path.join(__dirname, 'reporting.local.env.sh');
if (!fs.existsSync(localEnv)) {
  console.log('Creating "reporting.local.env.sh"');
  fs.writeFileSync(localEnv, '#!/bin/bash\n\nexport ELASTIC_URL="$ELASTIC_SCHEME://$ELASTIC_HOST:$ELASTIC_PORT"\n\nexport DATABASE_URL="$DATABASE_PROTOCOL://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_DB?schema=default"')
}

const Colors = {
  _clear: '\x1b[0m',
  _dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};
const withColor = (str, color) => `${color}${str}${Colors._clear}`;

const searchForPackageLock = (cwd) => {
  const files = fs.readdirSync(cwd)
  for (const file of files) {
    if (file !== 'node_modules' && !file.startsWith('.')) {
      const filePath = path.join(cwd, file);

      if (file === 'package-lock.json') {
        console.log(`\n${withColor(`i Installing "${path.basename(cwd)}" dependencies`, Colors.cyan)}`)
        const stdOut = execSync('npm ci', { cwd }).toString();
        const matches = /added (\d+).*audited (\d+).*in (\d+)s.*(\d+) vulnerabilities/gsi.exec(stdOut) ?? [];
        console.log(`${withColor(' OK', Colors.green)} (${withColor(`+${matches[1]}`, Colors.green)}, ${withColor(`!${matches[4]}`, Colors.red)}, ${withColor(`${matches[3]}s`, Colors._dim)})`);
        // Nested packages ?
        if (cwd !== __dirname)
          break;
      }

      if (file === 'package.json' && cwd !== __dirname) {
        console.warn(withColor(` Skipping "${path.basename(cwd)}" -> Doesn't have a lock-file`, Colors.yellow))
      }

      try {
        if (fs.statSync(filePath).isDirectory()) {
          searchForPackageLock(filePath)
        }
      } catch (error) {
        console.warn(withColor(` Skipping "${file}" -> ${error.message}`, Colors.yellow))
      }
    }
  }
}
searchForPackageLock(__dirname)
