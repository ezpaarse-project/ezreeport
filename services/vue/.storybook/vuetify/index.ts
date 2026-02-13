// oxlint-disable-next-line no-unassigned-import
import 'vuetify/styles';
import { createVuetify, type VuetifyOptions } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { useI18n } from 'vue-i18n';

import { Tooltip } from 'vuetify/directives';

import { i18n } from '../i18n';
import { LocaleDateFnsAdapter } from './date-io';

const config: VuetifyOptions = {
  date: {
    adapter: LocaleDateFnsAdapter,
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#539FDA',
        },
      },
    },
  },
  // Workaround to have tooltips in storybook, as resolver doesn't import them
  directives: {
    Tooltip,
  },
};

export const vuetify = createVuetify(config);
