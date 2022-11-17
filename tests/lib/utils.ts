import { randomBytes } from 'node:crypto';

export const randomString = () => randomBytes(20)
  .toString('base64')
  .replace(/[?/]/g, '_');
