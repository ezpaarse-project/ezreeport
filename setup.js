const fs = require('fs');
const path = require('path')
const { execSync } = require('child_process')

const BASE_PATH = path.join(__dirname, 'src');
const services = fs.readdirSync(BASE_PATH);

for (const service of services) {
  const localEnv = path.join(BASE_PATH, service, `${service}.local.env`);
  if (!fs.existsSync(localEnv)) {
    fs.writeFileSync(localEnv, "")
  }

  const packageLock = path.join(BASE_PATH, service, 'package-lock.json');
  if (fs.existsSync(packageLock)) {
    execSync('npm ci', { cwd: path.join(BASE_PATH, service) });
  }
}

execSync(`cd ${BASE_PATH}`);