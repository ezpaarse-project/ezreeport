<template>
  <v-row>
    <v-col
      v-for="(figure, i) in sortedItems"
      :key="figure._.id"
      cols="12"
      :md="12 / grid.cols"
    >
      <FigureDetail
        v-if="readonly"
        :figure="figure"
        :id="i"
        locked
      />
      <FigureForm
        v-else
        :figure="figure"
        :id="i"
        :taken-slots="takenSlots"
        @update:figure="onFigureUpdate($event)"
        @delete:figure="onFigureDelete($event)"
        @validation="onValidation(figure, $event)"
      />
    </v-col>

    <v-col
      v-if="
        !readonly
          && items.length < grid.cols * grid.rows
      "
      class="d-flex align-center justify-center"
    >
      <v-tooltip>
        <template #activator="{ attrs, on }">
          <v-btn
            fab
            v-bind="attrs"
            v-on="on"
            @click="onFigureCreate"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>

        <span>{{ $t('actions.add-figure') }}</span>
      </v-tooltip>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { addAdditionalData, type AnyCustomFigure } from './customTemplates';

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
    readonly: {
      type: Boolean,
      default: true,
    },
  },
  emits: {
    'update:items': (v: AnyCustomFigure[]) => v.length >= 0,
  },
  computed: {
    /**
     * The figures sorted by slot
     */
    sortedItems() {
      const figures = [...this.items];
      return figures.sort(
        (a, b) => Math.max(...(a.slots ?? [])) - Math.max(...(b.slots ?? [])),
      );
    },
    /**
     * The slots taken by the figures
     */
    takenSlots(): number[] {
      return this.items.reduce(
        (taken, { slots }) => (slots ? [...taken, ...slots] : taken),
        [] as number[],
      );
    },
  },
  methods: {
    /**
     * Update a figure in current layout
     *
     * @param value The new figure
     */
    onFigureUpdate(value: AnyCustomFigure) {
      const index = this.items.findIndex(({ _: { id } }) => id === value._.id);
      if (this.readonly || !this.items[index]) {
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
      if (this.readonly) {
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
      if (this.readonly || !this.items[index]) {
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

<style scoped>

</style>

<i18n lang="yaml">
en:
  actions:
    add-figure: 'Add figure'
fr:
  actions:
    add-figure: 'Ajouter une visualisation'
</i18n>
