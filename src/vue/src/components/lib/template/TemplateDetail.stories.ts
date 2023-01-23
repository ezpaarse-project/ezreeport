import type { Meta, StoryObj } from '@storybook/vue';
import mockTasks from '~/mock/tasks';
import mockTemplates from '~/mock/templates';
import TemplateDetail from './TemplateDetail.vue';

const meta: Meta<typeof TemplateDetail> = {
  title: 'Templates/Internal/TemplateDetail',
  component: TemplateDetail,
};

export default meta;

type Story = StoryObj<typeof TemplateDetail>;

export const Task: Story = {
  args: {
    template: mockTasks[0].template,
  },
  render: (args) => ({
    components: { TaskTemplate: TemplateDetail },
    props: Object.keys(args),
    template: '<TaskTemplate v-bind="$props" v-on="$props" />',
  }),
};

export const Template: Story = {
  args: {
    template: mockTemplates[0].template,
  },
  render: (args) => ({
    components: { TaskTemplate: TemplateDetail },
    props: Object.keys(args),
    template: '<TaskTemplate v-bind="$props" v-on="$props" />',
  }),
};
