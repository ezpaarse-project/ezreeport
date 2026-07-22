// oxlint-disable-next-line no-unassigned-import
import 'vuetify/styles';
import { useI18n } from 'vue-i18n';
import { type VuetifyOptions, createVuetify } from 'vuetify';
import { Tooltip } from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';

import { i18n } from '../i18n';
import { LocaleDateFnsAdapter } from './date-io';

const config: VuetifyOptions = {
  date: {
    adapter: LocaleDateFnsAdapter,
  },
  // Workaround to have tooltips in storybook, as resolver doesn't import them
  directives: {
    Tooltip,
  },
  icons: {
    aliases,
    defaultSet: 'mdi',
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
};

export const vuetify = createVuetify(config);
