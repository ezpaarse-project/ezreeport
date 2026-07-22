import DateFnsAdapter from '@date-io/date-fns';
import { enUS } from 'date-fns/locale';

declare module 'vuetify' {
  // oxlint-disable-next-line typescript/no-namespace
  namespace DateModule {
    // oxlint-disable-next-line no-empty-interface, consistent-type-definitions, no-empty-object-type
    interface Adapter extends DateFnsAdapter {}
  }
}

export class LocaleDateFnsAdapter extends DateFnsAdapter {
  constructor(options?: Record<string, unknown>) {
    super({
      ...options,
      locale: enUS,
    });
  }
}
