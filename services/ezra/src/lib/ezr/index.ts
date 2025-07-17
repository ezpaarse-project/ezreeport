import type { Command } from '@oclif/core';
import axios, { isAxiosError, type AxiosInstance } from 'axios';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';

import { Readable, Transform } from 'node:stream';

const logError = (error: any, logToStderr: Command['logToStderr']) => {
  let text = '\nError: ';

  if (error instanceof Error) {
    text += error.message;
  } else {
    text += error || 'Unknown error';
  }

  if (isAxiosError(error)) {
    const data = Object.assign(
      { error: { message: 'Unknown details' } },
      error.response?.data,
    );
    text += ` - ${data.error.message}`;
  }

  logToStderr(chalk.red(text));
  if (!isAxiosError(error)) {
    console.trace();
  }
};

export class EZR {
  public fetch: AxiosInstance;

  constructor(private command: Command) {
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
    const answers = {
      url: opts?.url || await input({ message: 'API URL' }),
      apiKey: opts?.apiKey || await input({ message: 'API key' }),
      admin: opts?.admin || await input({ message: 'Admin username' }),
    };

    this.fetch.defaults.baseURL = answers.url;
    this.fetch.defaults.headers.common['X-API-Key'] = answers.apiKey;

    const action = ora(chalk.grey('Authenticating as admin...')).start();
    try {
      const { data: { content: adminUser } } = await this.fetch.get(`/admin/users/${answers.admin}`);
      this.fetch.defaults.headers.common.Authorization = `Bearer ${adminUser.token}`;
    } catch (error) {
      action.fail(chalk.red((error as Error).message));
      throw error;
    }
    action.succeed(chalk.grey('Logged as admin'));

    return answers;
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
    const logToStderr = (text: string) => this.command.logToStderr(text);

    const action = ora({
      indent: 6,
      text: chalk.grey(`Getting ${chalk.bold(opts.type)}`),
    }).start();

    let list: ListItem[];
    let meta: any;
    try {
      const { data } = await fetch.get<{ content: ListItem[], meta: any }>(
        opts.urls.list,
        { params: { count: 0 } },
      );
      list = data.content;
      meta = data.meta;
    } catch (error) {
      action.fail(chalk.red((error as Error).message));
      throw error;
    }
    action.stop();

    const filtered = opts.filter ? list.filter((item) => opts.filter?.(item, meta)) : list;

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
              logError(error, logToStderr);
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
    const logToStderr = (text: string) => this.command.logToStderr(text);

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
            logError(error, logToStderr);
            process.exit(1);
          }
        },
      }),
    };
  }
}
