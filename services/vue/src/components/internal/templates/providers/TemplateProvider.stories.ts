import type { Meta, StoryObj } from '@storybook/vue';
import { defineComponent } from 'vue';
import mockTasks from '~/mock/tasks';
import mockTemplates from '~/mock/templates';
import useTemplateStore from '~/stores/template';
import TemplateProvider from './TemplateProvider.vue';
import JSONPreview from '../../utils/hljs/JSONPreview.vue';

const meta: Meta<typeof TemplateProvider> = {
  component: TemplateProvider,
  args: {

  },
  argTypes: {

  },
};

export default meta;

const template = `<v-card>
  <v-card-title>
    Current Template Data
  </v-card-title>

  <v-card-text>
    <JSONPreview :value="$ezRTemplate.state" class="mt-4" />
  </v-card-text>

  <v-card-actions>
    <v-btn @click="setTemplate">
      Set template
    </v-btn>
    <v-btn @click="clearTemplate">
      Clear template
    </v-btn>
  </v-card-actions>
</v-card>`;

const FullTemplateDemo = defineComponent({
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  components: { JSONPreview },
  template,
  methods: {
    setTemplate() {
      this.templateStore.SET_CURRENT(mockTemplates[0].body);
    },
    clearTemplate() {
      this.templateStore.SET_CURRENT(undefined);
    },
  },
});

const TaskTemplateDemo = defineComponent({
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  components: { JSONPreview },
  template,
  methods: {
    setTemplate() {
      this.templateStore.SET_CURRENT(mockTasks[0].template);
    },
    clearTemplate() {
      this.templateStore.SET_CURRENT(undefined);
    },
  },
});

type Story = StoryObj<typeof TemplateProvider>;

export const Basic: Story = {
  render: (args) => ({
    components: { TemplateProvider, FullTemplateDemo },
    props: Object.keys(args),
    template: `<div>
      <TemplateProvider v-bind="$props" v-on="$props">
        <FullTemplateDemo />
      </TemplateProvider>
    </div>`,
  }),
};

export const Task: Story = {
  render: (args) => ({
    components: { TemplateProvider, TaskTemplateDemo },
    props: Object.keys(args),
    template: `<div>
      <TemplateProvider v-bind="$props" v-on="$props">
        <TaskTemplateDemo />
      </TemplateProvider>
    </div>`,
  }),
};
