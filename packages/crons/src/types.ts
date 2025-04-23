import type { Logger } from '@ezreeport/logger';

export * from '@ezreeport/models/crons';

export type Awaitable<T> = Promise<T> | T;

export type Executor = (logger: Logger) => Awaitable<Record<string, unknown>>;
