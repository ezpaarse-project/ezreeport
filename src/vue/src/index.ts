/* eslint-disable no-restricted-syntax */
import type VueApp from 'vue';
import type VueI18n from 'vue-i18n';
import { PiniaVuePlugin } from 'pinia';
import components from './components';
import { version } from '../package.json';

import fr from './locales/fr.json';
import en from './locales/en.json';

import './style';

const i18nKey = '$ezreeport';
const i18nMessages = {
  fr,
  en,
};

export default {
  version,
  install(app: typeof VueApp) {
    app.use(PiniaVuePlugin);
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component);
    }

    // eslint-disable-next-line no-underscore-dangle
    const i18n: VueI18n = app.prototype._i18n;
    for (const [locale, msgs] of Object.entries(i18nMessages)) {
      i18n.mergeLocaleMessage(locale, { [i18nKey]: (msgs as any) });
    }
  },
};

export { default as ezReeportMixin } from './mixins/ezr';

export type GlobalEzRComponents = typeof components;
