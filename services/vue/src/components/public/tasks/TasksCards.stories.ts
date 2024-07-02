import type { Meta, StoryObj } from '@storybook/vue';
import TasksCards from './TasksCards.vue';

const meta: Meta<typeof TasksCards> = {
  title: 'ezr-task-cards (TasksCards)',
  component: TasksCards,
  args: {
    namespace: undefined,
    allowedNamespaces: undefined,
  },
  argTypes: {
    namespace: {
      control: { type: 'text' },
    },
    allowedNamespaces: {
      control: { type: 'object' },
    },
    hideNamespaceSelector: {
      control: { type: 'boolean' },
    },
    'update:namespace': {
      action: 'update:namespace',
      control: { type: null },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TasksCards>;

export const Basic: Story = {
  render: ({
    namespace: cN,
    allowedNamespaces: aN,
    hideNamespaceSelector: hNS,
    ...args
  }) => ({
    components: { TasksCards },
    props: Object.keys(args),
    data: () => ({
      namespace: cN,
      allowedNamespaces: aN,
      hideNamespaceSelector: hNS,
    }),
    watch: {
      namespace(val) { this.namespace = val; },
      allowedNamespaces(val) { this.allowedNamespaces = val; },
      hideNamespaceSelector(val) { this.hideNamespaceSelector = val; },
    },
    template: `<TasksCards
      :namespace.sync="namespace" 
      :allowedNamespaces="allowedNamespaces"
      :hideNamespaceSelector="hideNamespaceSelector"
      v-bind="$props"
      v-on="$props"
    />`,
  }),
};
