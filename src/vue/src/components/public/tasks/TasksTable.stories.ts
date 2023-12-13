import type { Meta, StoryObj } from '@storybook/vue';
import TasksTable from './TasksTable.vue';

const meta: Meta<typeof TasksTable> = {
  title: 'ezr-task-table (TasksTable)',
  component: TasksTable,
  args: {
    currentNamespace: undefined,
    allowedNamespaces: undefined,
  },
  argTypes: {
    currentNamespace: {
      control: { type: 'text' },
    },
    allowedNamespaces: {
      control: { type: 'object' },
    },
    'update:currentNamespace': {
      action: 'update:currentNamespace',
      control: { type: null },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TasksTable>;

export const Basic: Story = {
  render: ({ currentNamespace: cN, allowedNamespaces: aN, ...args }) => ({
    components: { TasksTable },
    props: Object.keys(args),
    data: () => ({
      currentNamespace: cN,
      allowedNamespaces: aN,
    }),
    watch: {
      currentNamespace(val) { this.currentNamespace = val; },
      allowedNamespaces(val) { this.allowedNamespaces = val; },
    },
    template: `<TasksTable
      :currentNamespace.sync="currentNamespace" 
      :allowedNamespaces="allowedNamespaces" 
      v-bind="$props"
      v-on="$props"
    />`,
  }),
};
