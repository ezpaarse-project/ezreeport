import { Client } from '@elastic/elasticsearch';
import config from './config';
import logger from './logger';
import { sleep } from './utils';

const {
  scheme, host, port, apiKey,
} = config.get('elasticsearch');

const client = new Client({
  node: {
    url: new URL(`${scheme}://${host}:${port}`),
  },
  auth: {
    apiKey,
  },
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === 'production' ?? false,
  },
});

const MAX_TRIES = 10;

export const getElasticClient = async () => {
  let tries = 0;
  while (tries < MAX_TRIES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { body: { status } } = await client.cluster.health({
        wait_for_status: 'yellow',
        timeout: '5s',
      });

      if (status !== 'yellow' && status !== 'green') {
        break;
      }
    } catch (error) {
      logger.error(`Can't connect to Elastic : ${error}. ${MAX_TRIES - tries} tries left.`);
    }

    tries += 1;
    // eslint-disable-next-line no-await-in-loop
    await sleep(1000);
  }
  return client;
};
