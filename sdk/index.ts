import EventEmitter from 'events';

export * as auth from './modules/auth';
// export * as crons from './modules/crons';
export * as health from './modules/health';
export * as queues from './modules/queues';
export * as report from './modules/report';

export const global = {
  /**
   * Refers to bundled `browserify/events`'s `EventEmitter`
   *
   * TODO: Eventfull-promises
   *
   * @see https://github.com/browserify/events
   */
  EventEmitter,
};
