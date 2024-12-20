import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: 'vue-component-meta',
    },
  },
  async viteFinal(viteConfig,) {
    const { mergeConfig } = await import('vite');
    const { default: i18n } = await import('@intlify/unplugin-vue-i18n/vite');

    return mergeConfig(viteConfig, {
      plugins: [
        i18n({
          include: 'src/locales/**',
          ssr: true,
        }),
      ],
    });
  },
};
export default config;
