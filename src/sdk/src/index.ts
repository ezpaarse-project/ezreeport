export * as auth from './modules/auth.public';
export * as crons from './modules/crons.public';
export * as health from './modules/health.public';
export * as tasksActivity from './modules/tasksActivity.public';
export * as tasksPresets from './modules/tasksPresets.public';
/** @deprecated Use `tasksActivity` instead */
export * as history from './modules/tasksActivity.public';
export * as namespaces from './modules/namespaces.public';
export * as queues from './modules/queues.public';
export * as reports from './modules/reports.public';
export * as setup from './modules/setup.public';
export * as tasks from './modules/tasks.public';
export * as templates from './modules/templates.public';
export * as elastic from './modules/elastic.public';
export { version } from '../package.json';

export type EzReeportSDK = {
  auth: typeof import('./modules/auth.public')
  crons: typeof import('./modules/crons.public')
  health: typeof import('./modules/health.public')
  /** @deprecated Use `tasksActivity` instead */
  history: typeof import('./modules/tasksActivity.public')
  namespaces: typeof import('./modules/namespaces.public')
  queues: typeof import('./modules/queues.public')
  reports: typeof import('./modules/reports.public')
  setup: typeof import('./modules/setup.public')
  tasks: typeof import('./modules/tasks.public')
  tasksActivity: typeof import('./modules/tasksActivity.public')
  tasksPresets: typeof import('./modules/tasksPresets.public')
  templates: typeof import('./modules/templates.public'),
  elastic: typeof import('./modules/elastic.public'),
  version: string,
};
