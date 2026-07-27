import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { Namespace } from '~sdk/namespaces';
import type { TemplateTag } from '~sdk/template-tags';

import ApiFiltersPanel from './ApiFiltersPanel.vue';

const meta: Meta<typeof ApiFiltersPanel> = {
  component: ApiFiltersPanel,
  title: 'Task/API Filters Panel',
};

export default meta;

type Story = StoryObj<typeof ApiFiltersPanel>;

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

export const Default: Story = {
  args: {
    modelValue: true,
    namespaces: mockNamespaces,
    tags: mockTags,
  },
  render: (args: unknown) => ({
    components: { ApiFiltersPanel },
    setup() {
      return { args };
    },
    template: '<ApiFiltersPanel v-bind="args" />',
  }),
};

export const WithTags: Story = {
  args: {
    modelValue: true,
    tags: mockTags,
  },
  render: (args: unknown) => ({
    components: { ApiFiltersPanel },
    setup() {
      return { args };
    },
    template: '<ApiFiltersPanel v-bind="args" />',
  }),
};

export const WithNamespaces: Story = {
  args: {
    modelValue: true,
    namespaces: mockNamespaces,
  },
  render: (args: unknown) => ({
    components: { ApiFiltersPanel },
    setup() {
      return { args };
    },
    template: '<ApiFiltersPanel v-bind="args" />',
  }),
};
