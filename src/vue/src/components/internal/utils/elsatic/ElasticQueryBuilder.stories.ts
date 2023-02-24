import type { Meta, StoryObj } from '@storybook/vue';
import tasks from '~/mock/tasks';
import { query } from '~/mock/elastic';
import ElasticQueryBuilder from './ElasticQueryBuilder.vue';

const meta: Meta<typeof ElasticQueryBuilder> = {
  title: 'Utils (Internal)/Elastic/ElasticQueryBuilder',
  component: ElasticQueryBuilder,
  args: {
    value: query,
  },
};

export default meta;

type Story = StoryObj<typeof ElasticQueryBuilder>;

export const Readonly: Story = {
  render: (args) => ({
    components: { ElasticQueryBuilder },
    props: Object.keys(args),
    template: '<ElasticQueryBuilder v-bind="$props" v-on="$props" />',
  }),
};

export const Editable: Story = {
  argTypes: {
    input: { action: 'input' },
  },
  render: (args) => ({
    components: { ElasticQueryBuilder },
    props: Object.keys(args),
    template: '<ElasticQueryBuilder v-bind="$props" v-on="$props" />',
  }),
};

export const BibCNRS: Story = {
  args: {
    value: (tasks[0].template.fetchOptions as any).filters,
  },
  render: (args) => ({
    components: { ElasticQueryBuilder },
    props: Object.keys(args),
    template: '<ElasticQueryBuilder v-bind="$props" v-on="$props" />',
  }),
};
