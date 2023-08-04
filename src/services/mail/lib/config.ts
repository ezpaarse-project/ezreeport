import config from 'config';
import type defaultConfig from '~/config/default.json';

type Config = typeof defaultConfig;

export default config as unknown as Config;
