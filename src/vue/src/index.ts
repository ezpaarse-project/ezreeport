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

type Options = {
  i18n?: InstanceType<typeof VueI18n>,
  i18nSilentFallbackWarn?: boolean
};

export default {
  version,
  install(app: typeof VueApp, options?: Options) {
    app.use(PiniaVuePlugin);
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component);
    }

    if (options?.i18n) {
      // eslint-disable-next-line no-param-reassign
      options.i18n.silentFallbackWarn = options?.i18nSilentFallbackWarn ?? true;
      for (const [locale, msgs] of Object.entries(i18nMessages)) {
        options.i18n.mergeLocaleMessage(locale, { [i18nKey]: (msgs as any) });
      }
    }
  },
};

export { default as ezReeportMixin } from './mixins/ezr';
export { useEzR } from './lib/ezreeport';

export type GlobalEzRComponents = typeof components;
