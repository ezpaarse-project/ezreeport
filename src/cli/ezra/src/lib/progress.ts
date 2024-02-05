import { ux } from '@oclif/core';
import { PassThrough, Writable } from 'stream';

export const createProgressBarStream = (opts: {
  total?: number,
  onEnd?: (count: number, total: number) => void,
}) => {
  const progress = ux.progress({
    barCompleteChar: '\u25A0',
    barIncompleteChar: ' ',
    format: ux.colorize('grey', '\t[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'),
  });

  let hasStarted = false;
  let processed = 0;
  return {
    total: new PassThrough({
      objectMode: true,
      transform(chunk, encoding, callback) {
        if (!hasStarted) {
          progress.start(0, 0);
          hasStarted = true;
        }

        progress.setTotal(progress.getTotal() + 1);
        callback(null, chunk);
      },
    }),
    progress: new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        if (!hasStarted) {
          progress.start(opts.total || 0, 0);
          hasStarted = true;
        }

        progress.increment();
        processed += 1;
        callback(null);
      },
      final(callback) {
        progress.stop();
        opts.onEnd?.(processed, progress.getTotal());
        callback();
      },
    }),
  };
};

export const createDummyWriteStream = () => new Writable({
  write(chunk, encoding, callback) {
    callback();
  },
});
