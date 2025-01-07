import type { Meta, StoryObj } from '@storybook/vue3';

import MultiTextField from './MultiTextField.vue';

const meta: Meta<typeof MultiTextField> = {
  title: 'Utils/MultiTextField',
  component: MultiTextField,
};

export default meta;

type Story = StoryObj<typeof MultiTextField>;

export const Empty: Story = {
  render: (args) => ({
    components: { MultiTextField },
    setup() {
      return { args };
    },
    template: '<MultiTextField v-bind="args" />',
  }),
  args: {
    modelValue: undefined,
  },
};

export const OneValue: Story = {
  render: (args) => ({
    components: { MultiTextField },
    setup() {
      return { args };
    },
    template: '<MultiTextField v-bind="args" />',
  }),
  args: {
    label: 'Lorem Ipsum',
    modelValue: 'Lorem',
  },
};

export const MultiValue: Story = {
  render: (args) => ({
    components: { MultiTextField },
    setup() {
      return { args };
    },
    template: '<MultiTextField v-bind="args" />',
  }),
  args: {
    label: 'Lorem Ipsum',
    modelValue: ['Lorem', 'Ipsum'],
  },
};

export const ManyValue: Story = {
  render: (args) => ({
    components: { MultiTextField },
    setup() {
      return { args };
    },
    template: '<MultiTextField v-bind="args" />',
  }),
  args: {
    label: 'Filtres Omeka',
    modelValue: [
      'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)',
      'Mozilla/5.0 (compatible; BLEXBot/1.0; +http://webmeup-crawler.com/)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
      'Mozilla/5.0 (compatible; bnf.fr_bot; +https://www.bnf.fr/fr/capture-de-votre-site-web-par-le-robot-de-la-bnf)',
      'NutchUL/Nutch-2.3.1',
      'Turnitin (https://bit.ly/2UvnfoQ)',
      'Mozilla/5.0 (compatible; DataForSeoBot/1.0; +https://dataforseo.com/dataforseo-bot)',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; DotBot/1.2; +https://opensiteexplorer.org/dotbot; help@moz.com)',
      'YandexBot',
      'Amazonbot',
      'NE Crawler',
      'BingPreview',
      'SeekportBot',
      'bingbot',
      'robot',
      'Googlebot',
      'CCBot',
      'Applebot',
      'SEO Crawler',
      '; bot',
      'serpstatbot',
      'Facebook',
      'PetalBot',
      'MJ12bot',
      'SpiderLing',
      'crawler',
      'Swiftfox',
      'SerendeputyBot',
      'curl',
      'FacebookBot',
      'okhttp',
      'none',
      'Python Requests',
      'Bytespider',
      'ClaudeBot',
      'Qwantify',
      'ImagesiftBot',
      'fidget-spinner-bot',
      'GPTBot',
      'PhxBot',
      'claudebot',
      'trendictionbot0',
      'Nutch',
      'HeadlessChrome',
      'Python',
      'Other',
      'AwarioBot',
      'OAI-SearchBot',
      'BacklinksExtendedBot',
      'archive.org_bot',
      'PerplexityBot',
      'com/bot',
    ],
  },
};
