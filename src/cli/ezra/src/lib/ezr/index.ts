import { ux } from '@oclif/core';
import axios from 'axios';

import { PassThrough, Transform } from 'node:stream';

import * as ezr from './index.js';

export const fetch = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setup = async (opts?: { url?: string, apiKey?: string, admin?: string }) => {
  const url = opts?.url || await ux.prompt('API URL', { required: true });
  fetch.defaults.baseURL = url;

  const apiKey = opts?.apiKey || await ux.prompt('API key', { required: true });
  fetch.defaults.headers.common['X-API-Key'] = apiKey;

  const admin = opts?.admin || await ux.prompt('Admin username', { required: true });
  const { data: { content: adminUser } } = await fetch.get(`/admin/users/${admin}`);
  fetch.defaults.headers.common.Authorization = `Bearer ${adminUser.token}`;
};

export const getDataAsStream = async <ListItem, Item>(opts: {
  urls: {
    list: string,
    item: (item: ListItem) => string,
  },
  labels: {
    start: string,
    end: (count: number) => string,
  },
  transform?: (item: Item) => any,
  filter?: (item: ListItem, meta: any) => boolean,
}) => {
  ux.action.start(ux.colorize('blue', opts.labels.start));

  const { data: { content: list, meta } } = await ezr.fetch<{ content: ListItem[], meta: any }>({
    method: 'GET',
    url: opts.urls.list,
    params: { count: 0 },
  });

  const filtered = opts.filter ? list.filter((item) => opts.filter?.(item, meta)) : list;
  ux.action.stop(ux.colorize('green', 'OK'));

  const transformer = opts.transform || ((item) => item);

  const progress = ux.progress({
    barCompleteChar: '\u25A0',
    barIncompleteChar: ' ',
    format: ux.colorize('grey', '\t[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'),
  });
  progress.start(filtered.length, 0);

  const stream = new PassThrough({ objectMode: true });
  const promises = filtered.map(
    async (item) => {
      try {
        const { data } = await ezr.fetch.get<{ content: Item }>(opts.urls.item(item));
        progress.increment();
        stream.write(transformer(data.content));
      } catch (error) {
        ux.logToStderr(ux.colorize('red', (error as Error).message));
      }
    },
  );

  Promise.all(promises)
    .then(() => {
      progress.stop();
      ux.log(ux.colorize('green', opts.labels.end(filtered.length)));
      stream.end();
    });

  return stream;
};
export const applyStreamAsData = <Item>(opts: {
  urls: {
    item: (item: Item) => string,
  }
  labels: {
    start: string,
    end: (count: number) => string,
  },
  transform?: (item: Item) => any,
}) => {
  ux.log(ux.colorize('blue', opts.labels.start));

  const transformer = opts.transform || ((item) => item);

  const progress = ux.progress({
    barCompleteChar: '\u25A0',
    barIncompleteChar: ' ',
    format: ux.colorize('grey', '\t[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'),
  });

  let count = 0;

  const stream = new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      if (count === 0) {
        progress.start(0, 0);
      }

      progress.setTotal(progress.getTotal() + 1);
      try {
        const { data } = await ezr.fetch.put(opts.urls.item(chunk), transformer(chunk));
        progress.increment();
        count += 1;
        callback(null, data.content);
      } catch (error) {
        ux.logToStderr(ux.colorize('red', (error as Error).message));
        callback(null, undefined);
      }
    },
  });

  stream.on('finish', () => {
    progress.stop();
    ux.log(ux.colorize('green', opts.labels.end(count)));
  });

  return stream;
};
