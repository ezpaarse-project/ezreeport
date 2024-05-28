import type { EZR } from './index.js';

type NamespaceListItem = any;
type Namespace = any;

export const createNamespacesReadStream = (
  ezr: EZR,
) => ezr.createDataReadStream<NamespaceListItem, Namespace>({
  type: 'namespaces',
  urls: {
    list: '/admin/namespaces',
    item: (item) => `/admin/namespaces/${item.id}`,
  },
  transform: ({ tasks, ...item }) => item,
  filter: (item) => item.id !== '_',
});

export const createNamespacesWriteStream = (
  ezr: EZR,
) => ezr.createDataWriteStream<Namespace>({
  urls: {
    item: (item) => `/admin/namespaces/${item.id}`,
  },
  transform: (item) => ({
    name: item.name,
    fetchLogin: item.fetchLogin,
    fetchOptions: item.fetchOptions,
    logoId: item.logoId,
  }),
});
