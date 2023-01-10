/* eslint-disable no-multiple-empty-lines */
export * as auth from './modules/auth';
export * as crons from './modules/crons';
export * as health from './modules/health';
export * as history from './modules/history';
export * as queues from './modules/queues';
export * as reports from './modules/reports';
export * as setup from './modules/setup';
export * as tasks from './modules/tasks';
export * as templates from './modules/templates';

export type EzReeportSDK = {
  auth: typeof import('./modules/auth')
  crons: typeof import('./modules/crons')
  health: typeof import('./modules/health')
  history: typeof import('./modules/history')
  queues: typeof import('./modules/queues')
  reports: typeof import('./modules/reports')
  setup: typeof import('./modules/setup')
  tasks: typeof import('./modules/tasks')
  templates: typeof import('./modules/templates')
};
