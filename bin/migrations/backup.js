/**
 * This script copies a ezREEPORT into another ezREEPORT
 */
const { log } = require('./lib/log');
const { createDataFolder, writeError } = require('./lib/data');
const { prepare } = require('./lib/fetch');

const { getAllNamespaces } = require('./lib/namespaces');
const { getAllTemplates } = require('./lib/templates');
const { getAllTasks } = require('./lib/tasks');

// Accept self signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let DATA_FOLDER = '';

/**
 * Migrate namespaces
 */
const backupNamespaces = async () => {
  log('info', 'Getting namespaces...');
  const namespaces = await getAllNamespaces(DATA_FOLDER);
  log('success', `${namespaces.length} namespaces found`);
};

/**
 * Migrate templates
 */
const backupTemplates = async () => {
  log('info', 'Getting templates...');
  const templates = await getAllTemplates(DATA_FOLDER);
  log('success', `${templates.length} templates found`);
};

/**
 * Migrate tasks
 */
const backupTasks = async () => {
  log('info', 'Getting tasks...');
  const tasks = await getAllTasks(DATA_FOLDER);
  log('success', `${tasks.length} tasks found`);
};

const main = async () => {
  // Prepare vars
  const [srcURL, dstURL] = process.argv.slice(2);
  await prepare('src', srcURL);
  await prepare('dst', dstURL);

  // Prepare data
  DATA_FOLDER = await createDataFolder('back');

  // Transfer
  await backupNamespaces();
  await backupTemplates();
  await backupTasks();
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log('error', 'An error occurred:', '\x1b[0m', err);
    writeError(err)
      .then(() => process.exit(1));
  });
