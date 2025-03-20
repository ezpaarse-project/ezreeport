import 'vuetify/styles';
import { createVuetify, type VuetifyOptions } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import DateFnsAdapter from '@date-io/date-fns';

export const config: VuetifyOptions = {
  date: {
    adapter: DateFnsAdapter,
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
};

export default createVuetify(config);
