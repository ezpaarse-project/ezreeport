<template>
  <div class="d-flex flex-column">
    <template v-if="mode !== 'view'">
      <div class="d-flex pa-2" style="min-height: 44px;">
        <template>
          <v-btn
            small
            elevation="0"
            color="success"
            :disabled="items.length >= grid.cols * grid.rows"
            @click="onFigureCreate"
          >
            <v-icon left>mdi-plus</v-icon>
            {{ $t('actions.add') }}
          </v-btn>
        </template>
      </div>

      <v-divider />
    </template>

    <div class="pa-2" style="overflow-y: auto; flex: 1;">
      <SlotItemGrid
        :items="items"
        :grid="grid"
        show-unused
        v-on="gridListeners"
      >
        <template #item="{ item: figure, isDraggable, isHovered }">
          <FigureDetail
            v-if="mode !== 'allowed-edition'"
            :figure="figure"
            :locked="mode === 'denied-edition'"
            :class="[
              'figure-slot',
              isHovered && 'figure-slot--hovered primary--text',
            ]"
          />
          <FigureForm
            v-else
            :figure="figure"
            :taken-slots="takenSlots"
            :draggable="isDraggable"
            :class="[
              'figure-slot',
              isHovered && 'figure-slot--hovered primary--text',
            ]"
            @update:figure="onFigureUpdate"
            @delete:figure="onFigureDelete"
            @validation="onValidation(figure, $event)"
          />
        </template>

      </SlotItemGrid>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { addAdditionalData, type AnyCustomFigure } from '~/lib/templates/customTemplates';

export default defineComponent({
  props: {
    items: {
      type: Array as PropType<AnyCustomFigure[]>,
      required: true,
    },
    grid: {
      type: Object as PropType<{ cols: number, rows: number }>,
      default: () => ({ cols: 2, rows: 2 }),
    },
    mode: {
      type: String as PropType<'view' | 'allowed-edition' | 'denied-edition'>,
      default: 'view',
    },
  },
  emits: {
    'update:items': (v: AnyCustomFigure[]) => v.length >= 0,
  },
  computed: {
    /**
     * The slots taken by the figures
     */
    takenSlots(): number[] {
      return this.items.reduce(
        (taken, { slots }) => (slots ? [...taken, ...slots] : taken),
        [] as number[],
      );
    },
    /**
     * Listeners for figure grid
     */
    gridListeners() {
      if (this.mode !== 'allowed-edition') {
        return { };
      }
      return {
        'update:items': this.onFigureListUpdate,
      };
    },
  },
  methods: {
    /**
     * TS wrapper for updating figure list
     *
     * @param items the figure list
     */
    onFigureListUpdate(items: { slots?: number[] }[]) {
      this.$emit('update:items', items as AnyCustomFigure[]);
    },
    /**
     * Update a figure in current layout
     *
     * @param value The new figure
     */
    onFigureUpdate(value: AnyCustomFigure) {
      const index = this.items.findIndex(({ _: { id } }) => id === value._.id);
      if (this.mode !== 'allowed-edition' || !this.items[index]) {
        return;
      }

      const items = [...this.items];
      items.splice(index, 1, value);
      this.$emit('update:items', items);
    },
    /**
     * Add a new figure in current layout
     */
    onFigureCreate() {
      if (this.mode !== 'allowed-edition') {
        return;
      }

      const defaultFigure: AnyCustomFigure = addAdditionalData({ type: 'md', params: {} });
      this.$emit('update:items', [...this.items, defaultFigure]);
    },
    /**
     * Delete a figure in current layout
     *
     * @param index The index of the figure in the layout
     */
    onFigureDelete(value: AnyCustomFigure) {
      const index = this.items.findIndex(({ _: { id } }) => id === value._.id);
      if (this.mode !== 'allowed-edition' || !this.items[index]) {
        return;
      }

      const items = [...this.items];
      items.splice(index, 1);
      this.$emit('update:items', items);
    },
    /**
     * Set error state in figure
     *
     * @param figure The figure
     * @param value The validation value
     */
    onValidation(figure: AnyCustomFigure, value: boolean) {
      this.onFigureUpdate({
        ...figure,
        // Set validation state
        _: {
          ...figure._,
          hasError: !value,
        },
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.figure-slot {
  height: 100%;
  transition: border-color 0.25s;

  &--hovered {
    border-color: currentColor;
  }
}
</style>

<i18n lang="yaml">
en:
  actions:
    add: 'Add figure'
fr:
  actions:
    add: 'Ajouter une visualisation'
</i18n>