const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout } = require('node:timers/promises');

const { $fetch } = require('./fetch');
const { writeJSONData } = require('./data');
const { log } = require('./log');

/**
 * Get all complete templates in SRC
 *
 * @param {string} DATA_FOLDER The data folder
 *
 * @returns The complete list of templates
 */
const getAllTemplates = async (DATA_FOLDER) => {
  const { content: templateList } = await $fetch('src', '/templates');

  await fs.mkdir(path.join(DATA_FOLDER, 'templates'), { recursive: true });
  await writeJSONData('templates.json', templateList);

  const templates = await Promise.all(
    templateList
      .filter((t) => t.name !== 'scratch')
      .map(
        async (t) => {
          const { content: template } = await $fetch('src', `/templates/${t.id || t.name}`);
          await writeJSONData(path.join('templates', `${t.id || t.name}.json`), template);
          return template;
        },
      ),
  );

  return templates;
};

/**
 * Upsert given templates in DST
 *
 * @param {*} templates The templates
 */
const upsertAllTemplates = async (templates) => { // Setup heartbeat
  let i = 0;
  const interval = setInterval(() => {
    const count = `${i}`.padStart(`${templates.length}`.length, '0');
    const percent = (i / templates.length).toLocaleString(undefined, { style: 'percent' });
    const remain = (((templates.length - i) * 250) / 1000).toFixed(0);
    log('info', `${count}/${templates.length} templates (${percent}) ETA ${remain}s`);
  }, 5000);

  // eslint-disable-next-line no-restricted-syntax
  for (const { id, ...template } of templates) {
    // eslint-disable-next-line no-await-in-loop
    await $fetch(
      'dst',
      `/templates/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: template.name,
          tags: template.tags,
          body: template.body,
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
  getAllTemplates,
  upsertAllTemplates,
};
