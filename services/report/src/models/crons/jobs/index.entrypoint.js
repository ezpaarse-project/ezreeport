/**
 * Entrypoint to `index.ts` with bullmq, as sandboxed processors have trouble with
 * starting an TypeScript file
 */

const { default: executor } = require('./index');

module.exports = (...params) => executor(...params);
