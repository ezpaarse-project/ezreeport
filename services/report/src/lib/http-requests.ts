/* eslint-disable func-names */
import axios, { type AxiosRequestTransformer } from 'axios';

import config from './config';
import { appLogger } from './logger';

import pckg from '../../package.json';

let bannedDomainsRegexp: RegExp[] = [];

/**
 * Print warning in logger to remind to set banned domains
 */
const warnNoBannedDomains = () => appLogger.warn('[http-requests] No banned domains defined. Please set REPORT_FETCHER_BANNED_DOMAINS or "fetcher.bannedDomains" in a config file to avoid SSRF attacks');

/**
 * Setup banned domains via ENV, if not available tries to get them from a config file
 */
const setupBannedDomains = async () => {
  const { bannedDomains } = config.fetcher;

  // Try to parse the provided domains as RegExs
  try {
    appLogger.verbose('[http-requests] Parsing banned domains as RegExs...');
    bannedDomainsRegexp = (bannedDomains as string[]).map(
      (domain) => new RegExp(`^${domain}$`, 'i'),
    );
  } catch (error) {
    appLogger.error(`[http-requests] An [error] occurred when registering banned domains: [${error}]`);
  }

  // Warn if no domains was provided
  if (bannedDomainsRegexp.length <= 0) {
    warnNoBannedDomains();
    return;
  }
  appLogger.verbose(`[http-requests] Registered banned domains: [${bannedDomainsRegexp.join('], [')}]`);
};

/**
 * Throws an error if a call is attempted on a banned domain
 *
 * @param data The request data
 * @param headers The request headers
 *
 * @returns The unmodified request data
 */
const preventForbiddenDomains: AxiosRequestTransformer = function (data) {
  if (bannedDomainsRegexp.length <= 0) {
    warnNoBannedDomains();
    return data;
  }

  const { hostname } = new URL(this.url ?? '', this.baseURL);
  if (bannedDomainsRegexp.some((regexp) => regexp.test(hostname))) {
    throw new Error(`Cannot fetch banned domain: ${hostname}`);
  }

  return data;
};

setupBannedDomains();

const http = axios.create({
  transformRequest: [
    preventForbiddenDomains,
  ],
  headers: {
    'User-Agent': `ezREEPORT/${pckg.version}`,
  },
});

export default http;
