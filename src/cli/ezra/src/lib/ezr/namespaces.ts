import { createDataReadStream, createDataWriteStream } from './index.js';

type NamespaceListItem = any;
type Namespace = any;

export const createNamespacesReadStream = () => createDataReadStream<NamespaceListItem, Namespace>({
  labels: {
    start: 'Getting namespaces',
    end: (count) => `${count} namespaces found`,
  },
  urls: {
    list: '/admin/namespaces',
    item: (item) => `/admin/namespaces/${item.id}`,
  },
  transform: ({ tasks, ...item }) => item,
  filter: (item) => item.id !== '_',
});

export const createNamespacesWriteStream = () => createDataWriteStream<Namespace>({
  urls: {
    item: (item) => `/admin/namespaces/${item.id}`,
  },
  labels: {
    start: 'Applying namespaces',
    end: (count) => `${count} namespaces applied`,
  },
  transform: (item) => ({
    name: item.name,
    fetchLogin: item.fetchLogin,
    fetchOptions: item.fetchOptions,
    logoId: item.logoId,
  }),
});
