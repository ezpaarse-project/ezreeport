import type { Meta, StoryObj } from '@storybook/vue';
import type { templates } from 'ezreeport-sdk-js';
import mockTasks from '~/mock/tasks';
import mockTemplates from '~/mock/templates';
import { addAdditionalData } from '~/lib/templates/customTemplates';
import TemplateDetail from './TemplateDetail.vue';

const meta: Meta<typeof TemplateDetail> = {
  title: 'Templates/Internal/Details/TemplateDetail',
  component: TemplateDetail,
};

export default meta;

type Story = StoryObj<typeof TemplateDetail>;

const mapLayouts = (layouts: templates.Layout[]) => layouts.map(
  (l) => {
    const figures = l.figures.map(addAdditionalData);
    return {
      ...addAdditionalData(l),
      figures,
    };
  },
);

export const Task: Story = {
  args: {
    template: {
      ...mockTasks[0].template,
      inserts: mapLayouts(mockTasks[0].template.inserts ?? []),
    },
  },
  render: (args) => ({
    components: { TaskTemplate: TemplateDetail },
    props: Object.keys(args),
    template: '<TaskTemplate v-bind="$props" v-on="$props" />',
  }),
};

export const Template: Story = {
  args: {
    template: {
      ...mockTemplates[0].template,
      layouts: mapLayouts(mockTemplates[0].template.layouts),
    },
  },
  render: (args) => ({
    components: { TaskTemplate: TemplateDetail },
    props: Object.keys(args),
    template: '<TaskTemplate v-bind="$props" v-on="$props" />',
  }),
};
