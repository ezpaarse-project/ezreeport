import { createFetch } from 'ofetch';

import pckg from '../../package.json';

import config from './config';
import { appLogger } from './logger';

const logger = appLogger.child({ scope: 'http-requests' });

let bannedDomainsRegexp: RegExp[] = [];

/**
 * Print warning in logger to remind to set banned domains
 */
const warnNoBannedDomains = (): void =>
  logger.warn(
    'No banned domains defined. Please set REPORT_FETCHER_BANNED_DOMAINS or "fetcher.bannedDomains" in a config file to avoid SSRF attacks'
  );

/**
 * Setup banned domains via ENV, if not available tries to get them from a config file
 */
export function initHttpRequests(): void {
  const { bannedDomains } = config.fetcher;

  // Try to parse the provided domains as RegExs
  try {
    logger.debug('Parsing banned domains as RegExs...');
    bannedDomainsRegexp = (bannedDomains as string[]).map(
      (domain) => new RegExp(`^${domain}$`, 'i')
    );
  } catch (error) {
    logger.error(error, 'Error occured while parsing banned domains as RegExs');
  }

  // Warn if no domains was provided
  if (bannedDomainsRegexp.length <= 0) {
    warnNoBannedDomains();
    return;
  }

  logger.info({
    bannedDomains: bannedDomainsRegexp.map((reg) => reg.source),
    msg: 'Registered banned domains',
  });
}

export const http = createFetch({
  defaults: {
    headers: {
      // Custom User Agent
      'User-Agent': `Mozilla/5.0 (compatible; ezREEPORT/${pckg.version}; +${pckg.homepage}); ofetch/${pckg.dependencies.ofetch.slice(1)}`,
    },
    // Check if not attempting to request banned domain
    onRequest: ({ request }) => {
      if (bannedDomainsRegexp.length <= 0) {
        warnNoBannedDomains();
        return;
      }

      const { hostname } = new URL(request.url);
      if (bannedDomainsRegexp.some((regexp) => regexp.test(hostname))) {
        throw new Error(`Cannot fetch banned domain: ${hostname}`);
      }
    },
  },
});
