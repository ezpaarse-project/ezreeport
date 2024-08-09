import { type Stream, Transform, Readable } from 'node:stream';
import { createWriteStream, createReadStream } from 'node:fs';
import readline from 'node:readline';

export const createJSONLWriteStream = (filename: string) => {
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

  stream
    .pipe(createWriteStream(filename, { encoding: 'utf-8' }));

  return stream;
};

export const createJSONLReadStream = (filename: string) => {
  const rl = readline.createInterface({
    input: createReadStream(filename),
    crlfDelay: Infinity,
  });

  const iterator = rl[Symbol.asyncIterator]();
  return new Readable({
    objectMode: true,
    async read() {
      const { done, value } = await iterator.next();
      if (done) {
        rl.close();
        this.push(null);
        return;
      }
      this.push(JSON.parse(value));
    },
  });
};

export const createStreamPromise = (stream: Stream) => new Promise<void>(
  (resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  },
);
