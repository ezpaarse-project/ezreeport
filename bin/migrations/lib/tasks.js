const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout } = require('node:timers/promises');

const { $fetch } = require('./fetch');
const { writeJSONData } = require('./data');
const { log } = require('./log');

/**
 * Get all complete tasks in SRC
 *
 * @param {string} DATA_FOLDER The data folder
 *
 * @returns The complete list of tasks
 */
const getAllTasks = async (DATA_FOLDER) => {
  const tasksList = [];
  let max = 1;
  let lastId = '';
  while (tasksList.length < max) {
    // eslint-disable-next-line no-await-in-loop
    const { content, meta } = await $fetch('src', `/tasks?previous=${lastId}`);
    max = meta.total;
    lastId = meta.lastId;
    tasksList.push(...content);
  }

  await fs.mkdir(path.join(DATA_FOLDER, 'tasks'), { recursive: true });
  await writeJSONData('tasks.json', tasksList);

  const tasks = await Promise.all(
    tasksList.map(
      async (t) => {
        const { content: task } = await $fetch('src', `/tasks/${t.id}`);
        await writeJSONData(path.join('tasks', `${t.id}.json`), task);
        return task;
      },
    ),
  );

  return tasks;
};

/**
 * Upsert given tasks in DST
 *
 * @param {*} tasks The tasks
 */
const upsertAllTasks = async (tasks) => {
  // Setup heartbeat
  let i = 0;
  const interval = setInterval(() => {
    const count = `${i}`.padStart(`${tasks.length}`.length, '0');
    const percent = (i / tasks.length).toLocaleString(undefined, { style: 'percent' });
    const remain = (((tasks.length - i) * 250) / 1000).toFixed(0);
    log('info', `${count}/${tasks.length} tasks (${percent}) ETA ${remain}s`);
  }, 5000);

  // eslint-disable-next-line no-restricted-syntax
  for (const { id, ...task } of tasks) {
    let isExist = true;
    try {
      // eslint-disable-next-line no-await-in-loop
      const { content: t } = await $fetch('dst', `/tasks/${id}`);
      if (t.namespace.id !== task.namespace.id) {
        // eslint-disable-next-line no-await-in-loop
        await $fetch('dst', `/tasks/${id}`, { method: 'DELETE' });
        isExist = false;
      }
    } catch (error) {
      isExist = false;
    }

    // eslint-disable-next-line no-await-in-loop
    await $fetch(
      'dst',
      `/tasks/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: task.name,
          targets: task.targets,
          template: task.template,
          extends: task.extends.id,
          recurrence: task.recurrence,
          nextRun: task.nextRun,
          enabled: task.enabled,
          namespace: !isExist ? task.namespace.id : undefined,
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
  getAllTasks,
  upsertAllTasks,
};
