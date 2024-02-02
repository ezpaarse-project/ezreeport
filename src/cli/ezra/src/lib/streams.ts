import { Transform } from 'node:stream';
import { createWriteStream } from 'node:fs';

export const createWriteJSONLStream = (filename: string) => {
  const stream = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        const json = JSON.stringify(chunk);
        callback(null, `${json}\n`);
      } catch (error) {
        callback(error as Error);
      }
    },
  });

  const file = createWriteStream(filename, { encoding: 'utf-8' });

  stream.pipe(file);

  return stream;
};

export const createStreamPromise = (stream: Transform) => new Promise<void>(
  (resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  },
);
