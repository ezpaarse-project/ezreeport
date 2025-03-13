import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';

// eslint-disable-next-line import/prefer-default-export
export const gunzipAsync = promisify(gunzip);
