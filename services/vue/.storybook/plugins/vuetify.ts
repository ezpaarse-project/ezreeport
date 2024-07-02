import type { UserVuetifyPreset } from 'vuetify';
import Vuetify from 'vuetify/lib';
import i18n from './i18n';

import '@mdi/font/css/materialdesignicons.min.css';

export const options: Partial<UserVuetifyPreset> = {
  icons: {
    iconfont: 'mdi',
  },
  lang: {
    t: (key, ...params) => i18n.t(key, params).toString(),
  },
};

export default new Vuetify(options);
