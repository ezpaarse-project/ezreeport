import { createDataReadStream, createDataWriteStream } from './index.js';

type TemplateListItem = any;
type Template = any;

export const createTemplatesReadStream = () => createDataReadStream<TemplateListItem, Template>({
  urls: {
    list: '/templates',
    item: (item) => `/templates/${item.id}`,
  },
  labels: {
    start: 'Getting templates',
    end: (count) => `${count} templates found`,
  },
  transform: ({ tasks, presets, ...item }) => item,
  filter: (item, meta) => item.id !== '_' || item.id !== meta.default,
});

export const createTemplatesWriteStream = () => createDataWriteStream<Template>({
  urls: {
    item: (item) => `/templates/${item.id}`,
  },
  labels: {
    start: 'Applying templates',
    end: (count) => `${count} templates applied`,
  },
  transform: (item) => ({
    name: item.name,
    tags: item.tags,
    body: item.body,
  }),
});
