import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { Component } from 'vue';

export const useStory = <Target extends Component>(
  meta: Meta<Target>
): {
  meta: Meta<Target>;
  defineStory: (data: unknown) => StoryObj<Target>;
} => ({
  // oxlint-disable-next-line typescript/explicit-function-return-type
  defineStory: (data) =>
    ({
      args: data,
      // oxlint-disable-next-line typescript/explicit-function-return-type
      render: (args: unknown) => ({
        // oxlint-disable-next-line no-underscore-dangle
        components: { [meta.component?.__name ?? 'target']: meta.component },
        setup(): { args: unknown } {
          return { args };
        },
        // oxlint-disable-next-line no-underscore-dangle
        template: `<${meta.component?.__name ?? 'target'} v-bind="args" />`,
      }),
    }) as unknown as StoryObj<Target>,
  meta,
});
