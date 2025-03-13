import type { appLogger } from '~/lib/logger';
import type config from '~/lib/config';

export * from '~common/types/crons';

export type Logger = typeof appLogger;

export type Awaitable<T> = Promise<T> | T;

export type Timers = keyof typeof config['timers'];

export type Executor = (logger: Logger) => Awaitable<Record<string, unknown>>;
