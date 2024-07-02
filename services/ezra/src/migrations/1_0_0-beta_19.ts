import { addDays } from 'date-fns';

import type { MigrationData } from './common.js';

const name = '1.0.0-beta.19';

/**
 * Give template's id based on name
 *
 * @param templates The original templates
 * @param templateIdsByName The mapping of template name to id
 *
 * @returns Migrated templates
 */
const migrateTemplates = (
  templates: MigrationData['templates'],
  templateIdsByName: Map<string, string>,
) => templates.map((template) => {
  const id = template.name.replace(/\//g, '_');
  templateIdsByName.set(template.name, id);

  return {
    id,
    ...template,
  };
});

/**
 * Moving extends to task root
 *
 * @param tasks The original tasks
 * @param templateIdsByName The mapping of template name to id
 *
 * @returns Migrated tasks
 */
const migrateTasks = (
  tasks: MigrationData['tasks'],
  templateIdsByName: Map<string, string>,
) => {
  const nextRun = addDays(new Date(), 1);
  return tasks.map((task) => ({
    ...task,
    extends: {
      id: templateIdsByName.get(task.template.extends),
    },
    template: {
      ...task.template,
      extends: undefined,
    },
    nextRun,
  }));
};

/**
 * Migrate data to 1.0.0-beta.19's format
 *
 * @param data The data to migrate
 *
 * @returns Migrated data
 */
const migrate = (data: MigrationData): MigrationData => {
  const templateIdsByName = new Map<string, string>();

  return {
    ...data,
    templates: migrateTemplates(data.templates, templateIdsByName),
    tasks: migrateTasks(data.tasks, templateIdsByName),
  };
};

export default {
  migrate,
  name,
};
