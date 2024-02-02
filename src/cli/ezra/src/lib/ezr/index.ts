import { ux } from '@oclif/core';
import axios from 'axios';

import { PassThrough, Readable, Writable } from 'node:stream';

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

export const createDataReadStream = async <ListItem, Item>(opts: {
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

  let index = 0;
  return new Readable({
    objectMode: true,
    async read() {
      if (index >= filtered.length) {
        progress.stop();
        ux.log(ux.colorize('green', opts.labels.end(filtered.length)));
        this.push(null);
        return;
      }

      const item = filtered[index];
      try {
        const { data } = await ezr.fetch.get<{ content: Item }>(opts.urls.item(item));
        progress.increment();
        this.push(transformer(data.content));
      } catch (error) {
        ux.logToStderr(ux.colorize('red', (error as Error).message));
      }
      index += 1;
    },
  });
};
export const createDataWriteStream = <Item>(opts: {
  urls: {
    item: (item: Item) => string,
  }
  labels: {
    start: string,
    end: (count: number) => string,
  },
  transform?: (item: Item) => any,
}): [PassThrough, Writable] => {
  ux.log(ux.colorize('blue', opts.labels.start));

  const transformer = opts.transform || ((item) => item);

  const progress = ux.progress({
    barCompleteChar: '\u25A0',
    barIncompleteChar: ' ',
    format: ux.colorize('grey', '\t[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'),
  });
  progress.start(0, 0);

  let count = 0;

  const stream = new Writable({
    objectMode: true,
    async write(chunk, encoding, callback) {
      try {
        await ezr.fetch.put(opts.urls.item(chunk), transformer(chunk));
        progress.increment();
        count += 1;
      } catch (error) {
        ux.logToStderr(ux.colorize('red', (error as Error).message));
      }
      callback();
    },
    final(callback) {
      progress.stop();
      ux.log(ux.colorize('green', opts.labels.end(count)));
      callback();
    },
  });

  const passThrough = new PassThrough({
    objectMode: true,
    transform(chunk, encoding, callback) {
      progress.setTotal(progress.getTotal() + 1);
      callback(null, chunk);
    },
  });

  return [
    passThrough,
    stream,
  ];
};
