import type { Meta } from '@storybook/vue3-vite';
import type { TemplateFilterMap } from '~sdk/helpers/filters';

import { useStory } from '~/__mocks__/utils';

import EditorFilter from './List.vue';

const meta: Meta<typeof EditorFilter> = {
  component: EditorFilter,
  title: 'Template Editor/Filters/List',
};

const { defineStory } = useStory(meta);

export default meta;

const mockFilters: TemplateFilterMap = new Map(
  [
    {
      field: 'rtype',
      isNot: false,
      name: 'rtype is ARTICLE',
      value: 'ARTICLE',
    },
    {
      field: 'mime',
      isNot: true,
      name: 'mime is not DOC, etc.',
      value: ['DOC', 'MISC'],
    },
    {
      field: 'mime',
      isNot: true,
      name: 'mime exists',
    },
    {
      isNot: false,
      name: 'filter-1',
      raw: {
        query_string: {
          query: '-(host:XXX.XX.XXX.X AND sid:"istex-api-harvester")',
        },
      },
    },
    {
      field: 'ua',
      name: 'OMEKA',
      value: [
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
  ].map((filter) => [filter.name, filter])
);

export const NewFilters = defineStory({
  modelValue: new Map(),
});

export const ExistingFilters = defineStory({
  modelValue: mockFilters,
});

export const ReadonlyFilters = defineStory({
  modelValue: mockFilters,
  readonly: true,
});
