import type { Logger } from 'pino';

export * from '@ezreeport/models/crons';

export type Awaitable<Type> = Promise<Type> | Type;

export type Executor = (logger: Logger) => Awaitable<Record<string, unknown>>;
