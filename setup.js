const fs = require('node:fs');
const path = require('node:path')
const { execSync } = require('node:child_process')

const BASE_PATH = path.join(__dirname, 'src/services');
const services = fs.readdirSync(BASE_PATH);

// Install main
const mainPackageLock = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(mainPackageLock)) {
  console.log('Installing "main" dependencies');
  execSync('npm ci', { cwd: __dirname });
}

const localEnv = path.join(__dirname, 'reporting.local.env.sh');
if (!fs.existsSync(localEnv)) {
  console.log('Creating "reporting.local.env.sh"');
  fs.writeFileSync(localEnv, '#!/bin/bash\n\nexport ELASTIC_URL="$ELASTIC_SCHEME://$ELASTIC_HOST:$ELASTIC_PORT"\n\nexport DATABASE_URL="$DATABASE_PROTOCOL://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_DB?schema=default"')
}

// Install tests
const testsPackageLock = path.join(__dirname, 'tests/package-lock.json');
if (fs.existsSync(testsPackageLock)) {
  console.log('Installing "tests" dependencies');
  execSync('npm ci', { cwd: path.join(__dirname, 'tests') });
}

// Install services
for (const service of services) {
  const packageLock = path.join(BASE_PATH, service, 'package-lock.json');
  if (fs.existsSync(packageLock)) {
    console.log(`Installing "${service}" dependencies`);
    execSync('npm ci', { cwd: path.join(BASE_PATH, service) });
  }
}
