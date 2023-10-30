/**
 * This script copies a ezREEPORT into another ezREEPORT
 */
const { log } = require('./lib/log');
const { writeError, readAllData } = require('./lib/data');
const { prepare } = require('./lib/fetch');

const { upsertAllNamespaces } = require('./lib/namespaces');
const { upsertAllTemplates } = require('./lib/templates');
const { upsertAllTasks } = require('./lib/tasks');

// Accept self signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let DATA_FOLDER = '';

/**
 * Migrate namespaces
 */
const transferNamespaces = async () => {
  log('info', 'Getting namespaces...');
  const namespaces = await readAllData(DATA_FOLDER, 'namespaces');
  log('success', `${namespaces.length} namespaces found`);

  log('info', 'Upserting namespaces...');
  await upsertAllNamespaces(namespaces.map((n) => ({ ...n, logoId: n.logoId || 'A' })));
  log('success', `${namespaces.length} namespaces upserted\n`);
};

/**
 * Migrate templates
 */
const transferTemplates = async () => {
  log('info', 'Getting templates...');
  const templates = await readAllData(DATA_FOLDER, 'templates');
  log('success', `${templates.length} templates found`);

  log('info', 'Upserting templates...');
  await upsertAllTemplates(templates);
  log('success', `${templates.length} templates upserted\n`);
};

/**
 * Migrate tasks
 */
const transferTasks = async () => {
  log('info', 'Getting tasks...');
  const tasks = await readAllData(DATA_FOLDER, 'tasks');
  log('success', `${tasks.length} tasks found`);

  log('info', 'Upserting tasks...');
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 1);

  await upsertAllTasks(tasks);
  log('success', `${tasks.length} tasks upserted\n`);
};

const main = async () => {
  // Prepare vars
  const [folder, dstURL] = process.argv.slice(2);
  if (!folder) {
    throw new Error("No first arg provided: can't get src folder");
  }
  DATA_FOLDER = folder;

  await prepare('dst', dstURL);

  // Transfer
  await transferNamespaces();
  await transferTemplates();
  await transferTasks();
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log('error', 'An error occurred:', '\x1b[0m', err);
    writeError(err)
      .then(() => process.exit(1));
  });
