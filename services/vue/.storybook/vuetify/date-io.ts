import { enUS } from 'date-fns/locale';
import DateFnsAdapter from '@date-io/date-fns';

export class LocaleDateFnsAdapter extends DateFnsAdapter {
  constructor(options?: Record<string, unknown>) {
    super({
      ...options,
      locale: enUS,
    });
  }
}

declare module 'vuetify' {
  namespace DateModule {
    // oxlint-disable-next-line no-empty-interface, consistent-type-definitions, no-empty-object-type
    interface Adapter extends DateFnsAdapter {}
  }
}
