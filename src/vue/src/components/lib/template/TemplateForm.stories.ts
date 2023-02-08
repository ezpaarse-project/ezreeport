import type { Meta, StoryObj } from '@storybook/vue';
import type { templates } from 'ezreeport-sdk-js';
import mockTasks from '~/mock/tasks';
import mockTemplates from '~/mock/templates';
import TemplateForm from './TemplateForm.vue';
import { addAdditionalData } from './customTemplates';

const meta: Meta<typeof TemplateForm> = {
  title: 'Templates/Internal/TemplateForm',
  component: TemplateForm,
  argTypes: {
    'update:template': { action: 'update:template' },
    validation: { action: 'validation' },
    // 'update:task-template': { action: 'update:task-template' },
    // 'update:full-template': { action: 'update:full-template' },
  },
};

export default meta;

type Story = StoryObj<typeof TemplateForm>;

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
    components: { TemplateForm },
    props: Object.keys(args),
    template: '<TemplateForm v-bind="$props" v-on="$props" />',
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
    components: { TemplateForm },
    props: Object.keys(args),
    template: '<TemplateForm v-bind="$props" v-on="$props" />',
  }),
};

export const Empty: Story = {
  args: {
    template: undefined,
  },
  render: (args) => ({
    components: { TemplateForm },
    props: Object.keys(args),
    template: '<TemplateForm v-bind="$props" v-on="$props" />',
  }),
};
