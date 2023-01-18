import type { Meta, StoryObj } from '@storybook/vue';
import mockTasks from '~/mock/tasks';
import TaskDetail from './TaskDetail.vue';

const meta: Meta<typeof TaskDetail> = {
  title: 'Tasks/Internal/TaskDetail',
  component: TaskDetail,
  args: {
    loading: false,
    task: mockTasks[0],
  },
};

export default meta;

type Story = StoryObj<typeof TaskDetail>;

export const Basic: Story = {
  render: (args) => ({
    components: { TaskDetail },
    props: Object.keys(args),
    template: '<TaskDetail v-bind="$props" v-on="$props" />',
  }),
};
