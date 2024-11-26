/**
 * Entrypoint to `index.ts` with bullmq, as sandboxed processors have trouble with
 * starting an TypeScript file
 */

const { default: executor } = require('./generate');

module.exports = (...params) => executor(...params);
