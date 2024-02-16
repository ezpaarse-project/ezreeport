const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout } = require('node:timers/promises');

const { $fetch } = require('./fetch');
const { writeJSONData } = require('./data');
const { log } = require('./log');

/**
 * Get all complete namespaces in SRC
 *
 * @param {string} DATA_FOLDER The data folder
 *
 * @returns The complete list of namespaces
 */
const getAllNamespaces = async (DATA_FOLDER) => {
  const namespaceList = [];
  let max = 1;
  let lastId = '';
  while (namespaceList.length < max) {
    // eslint-disable-next-line no-await-in-loop
    const { content, meta } = await $fetch('src', `/admin/namespaces?previous=${lastId}`);
    max = meta.total;
    lastId = meta.lastId;
    namespaceList.push(...content);
  }

  await fs.mkdir(path.join(DATA_FOLDER, 'namespaces'), { recursive: true });
  await writeJSONData('namespaces.json', namespaceList);

  const namespaces = await Promise.all(
    namespaceList
      .filter((n) => n.id !== '_')
      .map(
        async (n) => {
          const { content: namespace } = await $fetch('src', `/admin/namespaces/${n.id}`);
          await writeJSONData(path.join('namespaces', `${n.id}.json`), namespace);
          return namespace;
        },
      ),
  );

  return namespaces;
};

/**
 * Upsert given namespaces in DST
 *
 * @param {*} namespaces The namespaces
 */
const upsertAllNamespaces = async (namespaces) => {
  // Setup heartbeat
  let i = 0;
  const interval = setInterval(() => {
    const count = `${i}`.padStart(`${namespaces.length}`.length, '0');
    const percent = (i / namespaces.length).toLocaleString(undefined, { style: 'percent' });
    const remain = (((namespaces.length - i) * 250) / 1000).toFixed(0);
    log('info', `${count}/${namespaces.length} namespaces (${percent}) ETA ${remain}s`);
  }, 5000);

  // eslint-disable-next-line no-restricted-syntax
  for (const namespace of namespaces) {
    // eslint-disable-next-line no-await-in-loop
    await $fetch(
      'dst',
      `/admin/namespaces/${namespace.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: namespace.name,
          fetchLogin: namespace.fetchLogin,
          fetchOptions: namespace.fetchOptions,
          logoId: namespace.logoId,
        }),
      },
    );
    // eslint-disable-next-line no-await-in-loop
    await setTimeout(250);
    i += 1;
  }

  clearInterval(interval);
};

module.exports = {
  getAllNamespaces,
  upsertAllNamespaces,
};
