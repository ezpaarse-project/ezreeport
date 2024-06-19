import type { MigrationData } from './common.js';

const name = '1.0.0-beta.22';

/**
 * Applying layouts' aggs to fetchOptions
 *
 * @param figures The original figures
 * @param fetchOptions The layout's fetch options
 *
 * @returns Migrated figures
 */
const migrateFigures = (figures: any[], fetchOptions: any) => {
  const { aggs, aggregations } = fetchOptions ?? {};
  const haveAggs = aggs || aggregations;

  return figures.map((figure: any) => ({
    ...figure,
    fetchOptions: haveAggs ? { aggs, aggregations } : undefined,
  }));
};

/**
 * Moving aggs to figures
 * Keeping only fetchCount and filters from fetchOptions
 *
 * @param layouts The original layouts
 *
 * @returns Migrated layouts
 */
const migrateLayouts = (layouts: any[]) => layouts.map((layout: any) => {
  let fetchOptions;
  if (layout.fetchOptions) {
    fetchOptions = {
      fetchCount: layout.fetchOptions.fetchCount,
      filters: layout.fetchOptions.filters,
    };
  }

  return {
    ...layout,
    figures: migrateFigures(layout.figures, layout.fetchOptions),
    fetchOptions,
  };
});

/**
 * Migrate layouts
 *
 * @param templates The original templates
 *
 * @returns Migrated templates
 */
const migrateTemplates = (templates: any[]) => templates.map((template: any) => ({
  ...template,
  body: {
    ...template.body,
    layouts: migrateLayouts(template.body.layouts),
  },
}));

/**
 * Ensure that Elastic fetchOptions are present
 *
 * @param namespaces The original namespaces
 *
 * @returns Migrated namespaces
 */
const migrateNamespaces = (namespaces: any[]) => namespaces.map((namespace: any) => ({
  ...namespace,
  fetchOptions: {
    elastic: {},
    ...(namespace.fetchOptions ?? {}),
  },
}));

/**
 * Migrate inserts
 *
 * @param tasks The original tasks
 *
 * @returns Migrated tasks
 */
const migrateTasks = (tasks: any[]) => tasks.map((task: any) => ({
  ...task,
  template: {
    ...task.template,
    inserts: task.inserts && migrateLayouts(task.inserts),
  },
}));

/**
 * Migrate data to 1.0.0-beta.22's format
 *
 * @param data The data to migrate
 *
 * @returns Migrated data
 */
const migrate = async (data: MigrationData) => ({
  ...data,
  namespaces: migrateNamespaces(data.namespaces),
  templates: migrateTemplates(data.templates),
  tasks: migrateTasks(data.tasks),
});

export default {
  migrate,
  name,
};
