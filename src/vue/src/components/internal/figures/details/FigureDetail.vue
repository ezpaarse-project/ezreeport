<template>
  <v-sheet
    v-if="figure"
    rounded
    outlined
    class="pa-2"
  >
    <v-form>
      <div class="d-flex align-center">
        {{ figureTitle }}

        <v-spacer />

        <span class="text--secondary" style="font-size: 1.5em; opacity: 0.5;">
          {{ (index ?? 0) + 1 }}
        </span>

        <v-btn color="primary" small class="ml-3" @click="$emit('edit:figure', id)">
          {{ $t('$ezreeport.settings') }}

          <v-icon right>mdi-cog</v-icon>
        </v-btn>
      </div>

      <v-select
        :value="figure.type"
        :label="$t('$ezreeport.figures.type')"
        :items="figureTypes"
        readonly
        hide-details
        class="my-2"
      >
        <template #prepend>
          <v-icon>{{ figureIcons[figure.type] || 'mdi-help' }}</v-icon>
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
import type { SelectItem } from '~/types/vuetify';
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
  emits: {
    'edit:figure': (id: string) => !!id,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    figureIcons,
  }),
  computed: {
    figures() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );

      return layout?.figures;
    },
    index() {
      return this.figures?.findIndex(({ _: { id } }) => id === this.id);
    },
    figure(): AnyCustomFigure | undefined {
      return this.figures?.find(({ _: { id } }) => id === this.id);
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
      const items: SelectItem[] = [];

      const entries = Object.entries(figureTypes);
      for (let i = 0; i < entries.length; i += 1) {
        const [category, figures] = entries[i];

        // localize figure type
        const subItems = Object.entries(figures).map(
          ([value]) => ({
            value,
            text: this.$t(`$ezreeport.figures.type_list.${value}`).toString(),
          }),
        ).sort(
          (a, b) => a.text.localeCompare(b.text),
        );

        // add localized header
        items.push(
          { header: this.$t(`$ezreeport.figures.type_groups.${category}`).toString() },
          ...subItems,
        );

        // add divider if not last
        if (i < entries.length - 1) {
          items.push({ divider: true });
        }
      }

      return items;
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
