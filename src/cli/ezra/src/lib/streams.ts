import { Transform } from 'node:stream';
import { createWriteStream, createReadStream } from 'node:fs';
import readline from 'node:readline';

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

export const createReadJSONLStream = (filename: string) => {
  const rl = readline.createInterface({
    input: createReadStream(filename),
    crlfDelay: Infinity,
  });

  const stream = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        const data = JSON.parse(chunk);
        callback(null, data);
      } catch (error) {
        callback(error as Error);
      }
    },
  });

  rl.on('line', (line) => {
    stream.write(line);
  });
  rl.on('close', () => stream.end());

  return stream;
};

export const createStreamPromise = (stream: Transform) => new Promise<void>(
  (resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  },
);
