const console = require('node:console');

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_LEVEL = levels[process.env.LOG_LEVEL?.toLowerCase() || 'info'];

/**
 * Shorthand to log things
 *
 * @param {'info'|'success'|'error'|'warn'|'debug'} type Type of message
 * @param {any[]} args Content of message
 */
const log = (type, ...args) => {
  switch (type) {
    case 'info':
      if (LOG_LEVEL <= levels.info) {
        console.info('\x1b[34mi ', ...args, '\x1b[0m');
      }
      break;
    case 'success':
      if (LOG_LEVEL <= levels.info) {
        console.log('\x1b[32mV ', ...args, '\x1b[0m');
      }
      break;
    case 'debug':
      if (LOG_LEVEL <= levels.debug) {
        console.log('\x1b[90m  ', ...args, '\x1b[0m');
      }
      break;
    case 'error':
      if (LOG_LEVEL <= levels.error) {
        console.error('\x1b[31mX ', ...args, '\x1b[0m');
      }
      break;
    case 'warn':
      if (LOG_LEVEL <= levels.warn) {
        console.warn('\x1b[33m! ', ...args, '\x1b[0m');
      }
      break;

    default:
      console.log(...args);
      break;
  }
};

module.exports = {
  log,
};
