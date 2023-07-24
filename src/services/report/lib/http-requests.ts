/* eslint-disable func-names */
import axios, { type AxiosRequestTransformer } from 'axios';

import config from './config';
import pckg from '../package.json';

const { bannedDomains } = config.get('fetcher');
const bannedDomainsRegexp = (bannedDomains as string[]).map(
  (domain) => new RegExp(`^${domain}$`, 'i'),
);

/**
 * Throws an error if a call is attempted on a banned domain
 *
 * @param data The request data
 * @param headers The request headers
 *
 * @returns The unmodified request data
 */
const preventForbiddenDomains: AxiosRequestTransformer = function (data) {
  const { hostname } = new URL(this.url ?? '', this.baseURL);
  if (bannedDomainsRegexp.some((regexp) => regexp.test(hostname))) {
    throw new Error(`Cannot fetch banned domain: ${hostname}`);
  }

  return data;
};

const http = axios.create({
  transformRequest: [
    preventForbiddenDomains,
  ],
  headers: {
    'User-Agent': `ezREEPORT/${pckg.version}`,
  },
});

export default http;
