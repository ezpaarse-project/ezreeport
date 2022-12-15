import type G from 'glob';
import { glob } from 'glob';

export default (pattern: string, options?: G.IOptions) => new Promise<string[]>(
  (resolve, reject) => {
    glob(pattern, options ?? {}, (err, matches) => {
      if (err) {
        reject(err);
      } else {
        resolve(matches);
      }
    });
  },
);
