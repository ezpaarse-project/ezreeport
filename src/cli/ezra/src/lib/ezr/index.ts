import { ux } from '@oclif/core';
import axios, { isAxiosError, type AxiosInstance } from 'axios';

import { Readable, Transform } from 'node:stream';

const logError = (error: any) => {
  let text = 'Error: ';

  if (error instanceof Error) {
    text += error.message;
  } else {
    text += error || 'Unknown error';
  }

  if (isAxiosError(error)) {
    // eslint-disable-next-line prefer-object-spread
    const data = Object.assign(
      { content: { message: 'Unknown details' } },
      error.response?.data,
    );
    text += ` - ${data.content.message}`;
  }

  ux.logToStderr(ux.colorize('red', text));
  if (!isAxiosError(error)) {
    // eslint-disable-next-line no-console
    console.trace();
  }
};

export class EZR {
  public fetch: AxiosInstance;

  constructor() {
    this.fetch = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public async init(opts: {
    url?: string,
    apiKey?: string,
    admin?: string,
  }) {
    const url = opts?.url || await ux.prompt('API URL', { required: true });
    this.fetch.defaults.baseURL = url;

    const apiKey = opts?.apiKey || await ux.prompt('API key', { required: true });
    this.fetch.defaults.headers.common['X-API-Key'] = apiKey;

    const admin = opts?.admin || await ux.prompt('Admin username', { required: true });
    const { data: { content: adminUser } } = await this.fetch.get(`/admin/users/${admin}`);
    this.fetch.defaults.headers.common.Authorization = `Bearer ${adminUser.token}`;
  }

  public async createDataReadStream<ListItem, Item>(opts: {
    type: string,
    urls: {
      list: string,
      item: (item: ListItem) => string,
    },
    transform?: (item: Item) => any,
    filter?: (item: ListItem, meta: any) => boolean,
  }) {
    const { fetch } = this;

    ux.action.start(ux.colorize('grey', `\tGetting ${opts.type}`));

    const { data: { content: list, meta } } = await fetch.get<{ content: ListItem[], meta: any }>(
      opts.urls.list,
      { params: { count: 0 } },
    );

    const filtered = opts.filter ? list.filter((item) => opts.filter?.(item, meta)) : list;
    ux.action.stop(ux.colorize('grey', 'OK'));

    const transformer = opts.transform || ((item) => item);

    let index = 0;
    return {
      count: filtered.length,
      stream: new Readable({
        objectMode: true,
        async read() {
          if (index >= filtered.length) {
            this.push(null);
            return;
          }

          const item = filtered[index];
          if (item) {
            try {
              const { data } = await fetch.get<{ content: Item }>(opts.urls.item(item));
              this.push(transformer(data.content));
            } catch (error) {
              logError(error);
            }
          }

          index += 1;
        },
      }),
    };
  }

  public createDataWriteStream<Item>(opts: {
    urls: {
      item: (item: Item) => string,
    }
    transform?: (item: Item) => any
  }) {
    const { fetch } = this;

    const transformer = opts.transform || ((item) => item);

    return {
      stream: new Transform({
        objectMode: true,
        async transform(chunk, encoding, callback) {
          try {
            const { data: { content } } = await fetch.put<{ content: Item }>(
              opts.urls.item(chunk),
              transformer(chunk),
            );
            callback(null, content);
          } catch (error) {
            logError(error);
            callback();
          }
        },
      }),
    };
  }
}
