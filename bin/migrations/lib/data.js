const fs = require('node:fs/promises');
const path = require('node:path');

const { log } = require('./log');

let dataFolder = '';

/**
 * Create folder for storing data
 *
 * @param {string} [prefix] The prefix to the folder
 */
const createDataFolder = async (prefix) => {
  let name = new Date().toISOString();
  if (prefix) {
    name = `${prefix}_${name}`;
  }
  dataFolder = path.join(__dirname, '../data', name);
  await fs.mkdir(dataFolder, { recursive: true });
  return dataFolder;
};

/**
 * Shorthand to write JSON data
 *
 * @param {string} file The filename to write data
 * @param {*} data
 */
const writeJSONData = (file, data) => {
  log('debug', `Writing data into "${file}"...`);
  return fs.writeFile(
    path.join(dataFolder, file),
    JSON.stringify(data, undefined, 2),
    'utf-8',
  );
};

/**
 * Write error in a file
 *
 * @param {Error} error
 */
const writeError = async (error) => {
  try {
    await fs.writeFile(
      path.join(dataFolder, 'error.log'),
      error.stack,
    );
  } catch (err) {
    log('warn', "Can't write error:", '\x1b[0m', err);
  }
};

/**
 * Shorthand to read JSON data
 *
 * @param {string} file The filename to read data
 *
 * @returns {*} The data
 */
const readJSONData = async (file) => {
  log('debug', `Reading data from "${file}"...`);
  const content = await fs.readFile(path.join(dataFolder, file), 'utf-8');
  return JSON.parse(content);
};

/**
 * Read all JSON data present in a directory
 *
 * @param {string} base The base folder
 * @param {string} folder The folder to read data from
 */
const readAllData = async (base, folder) => {
  const root = path.join(__dirname, '../data', base, folder);
  const files = (await fs.readdir(root)).filter((s) => /\.json$/i.test(s));

  return Promise.all(
    files.map(
      async (file) => {
        log('debug', `Reading data from "${file}"...`);
        const content = await fs.readFile(path.join(root, file), 'utf-8');
        return JSON.parse(content);
      },
    ),
  );
};

module.exports = {
  createDataFolder,
  writeJSONData,
  readJSONData,
  readAllData,
  writeError,
};
