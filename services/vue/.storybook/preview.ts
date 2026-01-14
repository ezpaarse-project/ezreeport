import { setup, type Preview } from '@storybook/vue3-vite';

import { useI18n } from 'vue-i18n';

// oxlint-disable-next-line no-unassigned-import
import '@mdi/font/css/materialdesignicons.css';
import { useTheme } from 'vuetify';
import { VApp, VMain } from 'vuetify/components';

import { i18n } from './i18n';
import { vuetify } from './vuetify';
import { setupEzR } from './ezr';

setup((app) => {
  app.use(i18n);
  app.use(vuetify);

  setupEzR();
});

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    options: {
      storySort: {
        order: ['Intro', 'Public', '*', 'Template Editor', 'Utils'],
      },
    },
  },
  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'Locale',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'fr', title: 'Français' },
        ],
      },
    },
    theme: {
      name: 'Theme',
      description: 'Theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
  initialGlobals: {
    locale: 'en',
    theme: 'light',
  },
  decorators: [
    (story, { globals: { locale, theme } }) => ({
      components: { story, VApp, VMain },
      setup(): void {
        const { locale: i18nLocale } = useI18n();
        i18nLocale.value = locale;

        const vuetifyTheme = useTheme();
        vuetifyTheme.change(theme);
      },
      template: '<VApp><VMain><story /></VMain></VApp>',
    }),
  ],
};

export default preview;
