/**
 * This script copies a ezREEPORT (in specific version, check filename)
 * into another ezREEPORT (in other specific version, check filename) while
 * applying changes to data between those versions
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
 * Shorthand to sanitize template name to be used as id
 *
 * @param {string} name The template name
 *
 * @returns The template id
 */
const sanitizeTemplateName = (name) => name.replace(/\//g, '_');

/**
 * Check if versions are compatible with this script
 */
const checkVersions = async () => {
  log('info', 'Checking versions...');

  const { content: { currentVersion: srcVERSION } } = await $fetch('src', '/health');
  if (srcVERSION !== '1.0.0-beta.18') {
    throw new Error(`Version for src "${srcVERSION}" is not supported`);
  }

  const { content: { currentVersion: dstVERSION } } = await $fetch('dst', '/health');
  if (dstVERSION !== '1.0.0-beta.19') {
    throw new Error(`Version for dst "${dstVERSION}" is not supported`);
  }

  log('success', `Versions are compatible with this script (src="${srcVERSION}";dst="${dstVERSION}")\n`);
};

/**
 * Migrate namespaces
 */
const migrateNamespaces = async () => {
  log('info', 'Getting namespaces...');
  const namespaces = await getAllNamespaces(DATA_FOLDER);
  log('success', `${namespaces.length} namespaces found`);

  log('info', 'Upserting namespaces...');
  await upsertAllNamespaces(namespaces);
  log('success', `${namespaces.length} namespaces upserted\n`);
};

/**
 * Migrate templates
 */
const migrateTemplates = async () => {
  log('info', 'Getting templates...');
  const templates = await getAllTemplates(DATA_FOLDER);
  log('success', `${templates.length} templates found`);

  log('info', 'Upserting templates...');
  await upsertAllTemplates(
    templates.map((t) => ({ id: sanitizeTemplateName(t.name), ...t })),
  );
  log('success', `${templates.length} templates upserted\n`);
};

/**
 * Migrate tasks
 */
const migrateTasks = async () => {
  log('info', 'Getting tasks...');
  const tasks = await getAllTasks(DATA_FOLDER);
  log('success', `${tasks.length} tasks found`);

  log('info', 'Upserting tasks...');
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 1);

  await upsertAllTasks(
    tasks.map(({ template: { extends: extended, ...template }, ...task }) => ({
      template,
      extends: { id: sanitizeTemplateName(extended) },
      ...task,
      // Overriding nextRun to avoid issues
      nextRun,
    })),
  );
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
  DATA_FOLDER = await createDataFolder('18-19');

  // Migrate
  await migrateNamespaces();
  await migrateTemplates();
  await migrateTasks();
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log('error', 'An error occurred:', '\x1b[0m', err);
    writeError(err)
      .then(() => process.exit(1));
  });
