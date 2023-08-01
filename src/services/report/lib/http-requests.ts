/* eslint-disable func-names */
import axios, { type AxiosRequestTransformer } from 'axios';

import config from './config';
import { appLogger } from './logger';

import pckg from '../package.json';

let bannedDomainsRegexp: RegExp[] = [];

const warnNoBannedDomains = () => appLogger.verbose(`[http-requests] Registered banned domains: [${bannedDomainsRegexp.join(', ')}]`);

const setupBannedDomains = () => {
  const { bannedDomains } = config.get('fetcher');

  try {
    bannedDomainsRegexp = (bannedDomains as string[]).map(
      (domain) => new RegExp(`^${domain}$`, 'i'),
    );

    if (bannedDomainsRegexp.length <= 0) {
      warnNoBannedDomains();
      return;
    }
    appLogger.verbose(`[http-requests] Registered banned domains: [${bannedDomainsRegexp.join(', ')}]`);
  } catch (error) {
    appLogger.error(`[http-requests] An occured when registering banned domains: ${error}`);
  }
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
