import type { Logger } from '@ezreeport/logger';

export * from '@ezreeport/models/crons';

export type Awaitable<Type> = Promise<Type> | Type;

export type Executor = (logger: Logger) => Awaitable<Record<string, unknown>>;
