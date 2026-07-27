// oxlint-disable-next-line import/extensions
import { version as sdkVersion } from '../package.json' with { type: 'json' };

export const version: string = sdkVersion;

export { type ApiAuthOptions, prepareClient } from './lib/fetch';

export type { ApiRequestOptions, SdkPaginated } from './lib/api';
