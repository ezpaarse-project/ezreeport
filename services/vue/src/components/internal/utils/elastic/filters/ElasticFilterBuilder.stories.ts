import type { Meta, StoryObj } from '@storybook/vue';
import tasks from '~/mock/tasks';
import { query, omeka } from '~/mock/elastic';
import ElasticFilterBuilder from './ElasticFilterBuilder.vue';

const meta: Meta<typeof ElasticFilterBuilder> = {
  title: 'Utils (Internal)/Elastic/ElasticFilterBuilder',
  component: ElasticFilterBuilder,
  args: {
    value: query,
  },
};

export default meta;

type Story = StoryObj<typeof ElasticFilterBuilder>;

export const Readonly: Story = {
  render: (args) => ({
    components: { ElasticFilterBuilder },
    props: Object.keys(args),
    template: '<ElasticFilterBuilder v-bind="$props" v-on="$props" />',
  }),
};

export const Editable: Story = {
  argTypes: {
    input: { action: 'input' },
  },
  render: (args) => ({
    components: { ElasticFilterBuilder },
    props: Object.keys(args),
    template: '<ElasticFilterBuilder v-bind="$props" v-on="$props" />',
  }),
};

export const BibCNRS: Story = {
  args: {
    value: (tasks[0].template.fetchOptions as any).filters,
  },
  render: (args) => ({
    components: { ElasticFilterBuilder },
    props: Object.keys(args),
    template: '<ElasticFilterBuilder v-bind="$props" v-on="$props" />',
  }),
};

export const WayTooBig: Story = {
  args: {
    value: omeka,
  },
  render: (args) => ({
    components: { ElasticFilterBuilder },
    props: Object.keys(args),
    template: '<ElasticFilterBuilder v-bind="$props" v-on="$props" />',
  }),
};
