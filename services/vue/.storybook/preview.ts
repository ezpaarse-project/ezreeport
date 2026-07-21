import { type Preview, setup } from '@storybook/vue3-vite';
import { useI18n } from 'vue-i18n';
// oxlint-disable-next-line no-unassigned-import import/extensions
// import '@mdi/font/css/materialdesignicons.css';
import { useTheme } from 'vuetify';
import { VApp, VMain } from 'vuetify/components';

import { setupEzR } from './ezr';
import { i18n } from './i18n';
import { vuetify } from './vuetify';

setup((app) => {
  app.use(i18n);
  app.use(vuetify);

  setupEzR();
});

const preview: Preview = {
  decorators: [
    (story, { globals: { locale, theme } }) => ({
      components: { VApp, VMain, story },
      setup(): void {
        const { locale: i18nLocale } = useI18n();
        i18nLocale.value = locale;

        const vuetifyTheme = useTheme();
        vuetifyTheme.change(theme);
      },
      template: '<VApp><VMain><story /></VMain></VApp>',
    }),
  ],
  globalTypes: {
    locale: {
      defaultValue: 'en',
      description: 'Locale',
      name: 'Locale',
      toolbar: {
        icon: 'globe',
        items: [
          { title: 'English', value: 'en' },
          { title: 'Français', value: 'fr' },
        ],
      },
    },
    theme: {
      defaultValue: 'light',
      description: 'Theme',
      name: 'Theme',
      toolbar: {
        icon: 'contrast',
        items: [
          { title: 'Light', value: 'light' },
          { title: 'Dark', value: 'dark' },
        ],
      },
    },
  },
  initialGlobals: {
    locale: 'en',
    theme: 'light',
  },
  parameters: {
    options: {
      storySort: {
        order: ['Intro', 'Public', '*', 'Template Editor', 'Utils'],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
