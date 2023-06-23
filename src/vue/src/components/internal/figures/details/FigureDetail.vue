<template>
  <v-sheet
    v-if="figure"
    rounded
    outlined
    class="pa-2"
  >
    <!-- TODO: Move to only dialog for whole template -->
    <FigureDialogParams
      v-model="isFigureDialogParamsShown"
      :id="id"
      :layout-id="layoutId"
      readonly
    />

    <v-form>
      <div class="d-flex align-center">
        {{ figureTitle }}

        <v-spacer />

        <v-btn icon x-small @click="isFigureDialogParamsShown = true">
          <v-icon>mdi-cog</v-icon>
        </v-btn>
      </div>

      <v-select
        :label="$t('$ezreeport.figures.type')"
        :value="figure.type"
        :items="figureTypes"
        readonly
        item-text="label"
        item-value="value"
      >
        <template #prepend>
          <v-icon>{{ figureIcons[figure.type] }}</v-icon>
        </template>
      </v-select>

      <v-select
        :label="$t('$ezreeport.figures.slots')"
        :value="figure.slots || []"
        :items="availableSlots"
        readonly
        multiple
      />
    </v-form>
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomFigure } from '~/lib/templates/customTemplates';
import { figureTypes, figureIcons } from '~/lib/templates/figures';
import useTemplateStore from '~/stores/template';
import figureFormMap from '../types/forms';

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
    layoutId: {
      type: String,
      required: true,
    },
    takenSlots: {
      type: Array as PropType<number[]>,
      default: () => [],
    },
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    isFigureDialogParamsShown: false,
    figureIcons,
  }),
  computed: {
    figure(): AnyCustomFigure | undefined {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );
      return layout?.figures.find(({ _: { id } }) => id === this.id);
    },
    /**
     * Available slots
     */
    availableSlots() {
      if (!this.figure) {
        return [];
      }

      const length = this.templateStore.currentGrid.cols * this.templateStore.currentGrid.rows;

      const takenSet = new Set(this.takenSlots);
      const slotsSet = new Set(this.figure.slots);
      return Array.from({ length }, (_, i) => ({
        text: this.$t(`$ezreeport.figures.slots_list[${i}]`),
        value: i,
        disabled: takenSet.has(i) && !slotsSet.has(i),
      }));
    },
    /**
     * Localized figure types
     */
    figureTypes() {
      return figureTypes.map((value) => ({
        label: this.$t(`$ezreeport.figures.type_list.${value}`),
        value,
      }));
    },
    /**
     * Components that holds figure params
     */
    figureParamsForm() {
      if (!this.figure) {
        return undefined;
      }

      const component = figureFormMap[this.figure.type];
      if (component !== undefined) {
        return component;
      }
      // eslint-disable-next-line no-underscore-dangle
      return figureFormMap._default;
    },
    /**
     * Returns the title of the figure
     */
    figureTitle() {
      const title = this.figure?.params?.title;
      if (title) {
        return title.toString();
      }

      return this.$t(`$ezreeport.figures.type_list.${this.figure?.type || 'unknown'}`).toString();
    },
  },
});
</script>

<style scoped>
</style>
