/**
 * This script copies a ezREEPORT into another ezREEPORT
 */
const { log } = require('./lib/log');
const { createDataFolder, writeError } = require('./lib/data');
const { prepare, $fetch } = require('./lib/fetch');

const { getAllNamespaces, upsertAllNamespaces } = require('./lib/namespaces');
const { getAllTemplates, upsertAllTemplates } = require('./lib/templates');
const { getAllTasks, upsertAllTasks } = require('./lib/tasks');

// Accept self signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let DATA_FOLDER = '';

/**
 * Check if versions are compatible with this script
 */
const checkVersions = async () => {
  log('info', 'Checking versions...');

  const { content: { currentVersion: srcVERSION } } = await $fetch('src', '/health');
  const { content: { currentVersion: dstVERSION } } = await $fetch('dst', '/health');
  if (srcVERSION !== dstVERSION) {
    throw new Error(`Versions between the 2 instances are not the same (src="${srcVERSION}";dst="${dstVERSION}")`);
  }

  log('success', `Versions between the 2 instances are the same (src="${srcVERSION}";dst="${dstVERSION}")\n`);
};

/**
 * Migrate namespaces
 */
const transferNamespaces = async () => {
  log('info', 'Getting namespaces...');
  const namespaces = await getAllNamespaces(DATA_FOLDER);
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
  const templates = await getAllTemplates(DATA_FOLDER);
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
  const tasks = await getAllTasks(DATA_FOLDER);
  log('success', `${tasks.length} tasks found`);

  log('info', 'Upserting tasks...');
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 1);

  await upsertAllTasks(tasks);
  log('success', `${tasks.length} tasks upserted\n`);
};

const main = async () => {
  // Prepare vars
  const [srcURL, dstURL] = process.argv.slice(2);
  await prepare('src', srcURL);
  await prepare('dst', dstURL);

  // Test vars
  await checkVersions();

  // Prepare data
  DATA_FOLDER = await createDataFolder('trans');

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
