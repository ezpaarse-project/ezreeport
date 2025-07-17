import type { Logger } from '@ezreeport/logger';

import type config from '~/lib/config';

export * from '@ezreeport/models/crons';

export type Awaitable<Type> = Promise<Type> | Type;

export type Timers = keyof (typeof config)['timers'];

export type Executor = (logger: Logger) => Awaitable<Record<string, unknown>>;
