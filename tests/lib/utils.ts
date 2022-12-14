import { randomBytes } from 'node:crypto';

// eslint-disable-next-line import/prefer-default-export
export const randomString = () => randomBytes(20)
  .toString('base64')
  .replace(/[?/]/g, '_');
