// eslint-disable-next-line import/no-unresolved
const readline = require('node:readline/promises');

// Readline interface, used to ask for several tokens
const r = readline.createInterface(process.stdin, process.stdout);

const { log } = require('./log');

// Parse src and dst URL
const urls = {
  src: process.env.SRC_URL,
  dst: process.env.DST_URL,
};

// Prepare token vars
const secrets = {
  src: {
    admin: process.env.SRC_TOKEN,
    user: process.env.SRC_USER,
  },
  dst: {
    admin: process.env.DST_TOKEN,
    user: process.env.DST_USER,
  },
};

/**
 * Ensure that tokens are provided
 *
 * @param {'src'|'dst'} instance
 */
const askTokens = async (instance) => {
  if (!secrets[instance].admin) {
    secrets[instance].admin = await r.question(`\n"${urls[instance]}":\n\tSuper token: `);
  }
  if (!secrets[instance].user) {
    secrets[instance].user = await r.question('\tToken of an admin user: ');
  }
};

/**
 * Prepare vars
 *
 * @param {'src' | 'dst'} instance
 * @param {string} arg
 */
const prepare = async (instance, arg) => {
  const url = arg || urls[instance];
  if (!url) {
    throw new Error('No URL found');
  }

  urls[instance] = url.at(-1) === '/' ? url.slice(0, -1) : url;
  await askTokens(instance);
};

/**
 * Shorthand to fetch
 *
 * @param {'src' | 'dst'} instance The instance
 * @param {string} route The route (prefixed by /)
 * @param {RequestInit} params The params of fetch
 *
 * @returns The JSON response
 */
const $fetch = async (instance, route, params = {}) => {
  const url = `${urls[instance]}${route}`;
  const { user, admin } = secrets[instance];

  log('debug', `Fetching ${instance}: "${params.method || 'GET'} ${url}"...`);
  const response = await fetch(
    url,
    {
      ...params,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': admin || undefined,
        Authorization: user ? `Bearer ${user}` : undefined,
        ...params.headers,
      },
    },
  );
  const json = await response.json();
  if (!response.ok) throw new Error(`"${params.method || 'GET'} ${url}": ${json.content.message}`);
  return json;
};

module.exports = {
  prepare,
  $fetch,
};
