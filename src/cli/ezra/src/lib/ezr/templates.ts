import { EZR } from './index.js';

type TemplateListItem = any;
type Template = any;

export const createTemplatesReadStream = (
  ezr: EZR,
) => ezr.createDataReadStream<TemplateListItem, Template>({
  type: 'templates',
  urls: {
    list: '/templates',
    item: (item) => `/templates/${item.id}`,
  },
  transform: ({ tasks, presets, ...item }) => item,
  filter: (item, meta) => item.id !== '_' || item.id !== meta.default,
});

export const createTemplatesWriteStream = (
  ezr: EZR,
) => ezr.createDataWriteStream<Template>({
  urls: {
    item: (item) => `/templates/${item.id}`,
  },
  transform: (item) => ({
    name: item.name,
    tags: item.tags,
    body: item.body,
  }),
});
