import * as ezr from './index.js';

type NamespaceListItem = any;
type Namespace = any;

export const getNamespacesStream = () => ezr.getDataAsStream<NamespaceListItem, Namespace>({
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
