import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { Namespace } from '~sdk/namespaces';
import type { TemplateTag } from '~sdk/template-tags';

import ApiFiltersPanel from './ApiFiltersPanel.vue';

const meta: Meta<typeof ApiFiltersPanel> = {
  title: 'Task/API Filters Panel',
  component: ApiFiltersPanel,
};

export default meta;

type Story = StoryObj<typeof ApiFiltersPanel>;

const mockTags: TemplateTag[] = [
  { id: 'test', name: 'test', color: '#ff0000' },
];

const mockNamespaces: Namespace[] = [
  {
    id: 'abba8400-1216-11eb-af77-ff33b5dd411e',
    name: 'Inist-CNRS Service Négociations et Acquisitions',
    fetchLogin: {
      elastic: {
        username: '',
      },
    },
    fetchOptions: {
      elastic: {},
    },
    logoId: 'd80d56af8ee12a08a4be022dd544dc2b.png',
    createdAt: new Date('2025-10-17T12:38:11.650Z'),
    updatedAt: new Date('2025-11-06T09:00:16.276Z'),
  },
];

export const Default: Story = {
  render: (args) => ({
    components: { ApiFiltersPanel },
    setup() {
      return { args };
    },
    template: '<ApiFiltersPanel v-bind="args" />',
  }),
  args: {
    modelValue: true,
    tags: mockTags,
    namespaces: mockNamespaces,
  },
};

export const WithTags: Story = {
  render: (args) => ({
    components: { ApiFiltersPanel },
    setup() {
      return { args };
    },
    template: '<ApiFiltersPanel v-bind="args" />',
  }),
  args: {
    modelValue: true,
    tags: mockTags,
  },
};

export const WithNamespaces: Story = {
  render: (args) => ({
    components: { ApiFiltersPanel },
    setup() {
      return { args };
    },
    template: '<ApiFiltersPanel v-bind="args" />',
  }),
  args: {
    modelValue: true,
    namespaces: mockNamespaces,
  },
};
