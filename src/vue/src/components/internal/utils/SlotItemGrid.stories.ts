import type { Meta, StoryObj } from '@storybook/vue';
import SlotItemGrid from './SlotItemGrid.vue';

const meta: Meta<typeof SlotItemGrid> = {

  component: SlotItemGrid,
  args: {
    grid: {
      cols: 2,
      rows: 2,
    },
    items: [
      { slots: [0], _: { id: 'mock-0' } },
      { slots: [3], _: { id: 'mock-1' } },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof SlotItemGrid>;

export const Basic: Story = {
  render: (args) => ({
    components: { SlotItemGrid },
    props: Object.keys(args),
    template: `<div style="position: relative; height: 5rem;">
  <SlotItemGrid v-bind="$props" v-on="$props">
  </SlotItemGrid>
  </div>`,
  }),
};

// <template #item={ item, index }>
//   <v-sheet outlined rounded>
//     {{ index }}<br/>
//     {{ item }}
//   </v-sheet>
// </template>
