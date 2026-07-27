import type { Meta } from '@storybook/vue3-vite';
import type { Namespace } from '~sdk/namespaces';
import type { TemplateTag } from '~sdk/template-tags';

import { useStory } from '~/__mocks__/utils';

import ApiFiltersPanel from './ApiFiltersPanel.vue';

const meta: Meta<typeof ApiFiltersPanel> = {
  component: ApiFiltersPanel,
  title: 'Task/API Filters Panel',
};

const { defineStory } = useStory(meta);

export default meta;

const mockTags: TemplateTag[] = [
  { color: '#ff0000', id: 'test', name: 'test' },
];

const mockNamespaces: Namespace[] = [
  {
    createdAt: new Date('2025-10-17T12:38:11.650Z'),
    fetchLogin: {
      elastic: {
        username: '',
      },
    },
    fetchOptions: {
      elastic: {},
    },
    id: 'abba8400-1216-11eb-af77-ff33b5dd411e',
    logoId: 'd80d56af8ee12a08a4be022dd544dc2b.png',
    name: 'Inist-CNRS Service Négociations et Acquisitions',
    updatedAt: new Date('2025-11-06T09:00:16.276Z'),
  },
];

export const Default = defineStory({
  modelValue: true,
  namespaces: mockNamespaces,
  tags: mockTags,
});

export const WithTags = defineStory({
  modelValue: true,
  tags: mockTags,
});

export const WithNamespaces = defineStory({
  modelValue: true,
  namespaces: mockNamespaces,
});
