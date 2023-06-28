<template>
  <v-sheet
    v-if="figure"
    :draggable="preventDrag"
    rounded
    outlined
    class="pa-2"
    @mousedown="onDragAttempt"
    @dragstart="preventEvent"
  >
    <v-form>
      <div class="d-flex align-center">
        <v-icon v-if="draggable" class="figure-handle">mdi-drag</v-icon>

        <div v-if="figure.type === 'md' || figure.type === 'metric'" class="py-2">
          {{ figureTitle }}
        </div>
        <v-text-field
          v-else
          :label="$t('figures.title')"
          :value="figure.params.title"
          :placeholder="figureTitle"
          dense
          hide-details
          persistent-placeholder
          class="py-1"
          @input="figureTitle = $event"
        />

        <v-spacer />

        <v-tooltip top v-if="figure._.valid !== true" color="warning">
          <template #activator="{ attrs, on }">
            <v-icon
              color="warning"
              small
              v-bind="attrs"
              v-on="on"
            >
              mdi-alert
            </v-icon>
          </template>

          <span>{{ $t(figure._.valid.i18nKey) }}</span>
        </v-tooltip>

        <v-btn icon color="error" x-small @click="onFigureDelete">
          <v-icon>mdi-delete</v-icon>
        </v-btn>

        <v-btn icon x-small @click="$emit('edit:figure', id)">
          <v-icon>mdi-cog</v-icon>
        </v-btn>
      </div>

      <v-select
        :label="$t('$ezreeport.figures.type')"
        :value="figure.type"
        :items="figureTypes"
        item-text="label"
        item-value="value"
        hide-details
        class="my-2"
        @change="onFigureTypeChange"
      >
        <template #prepend>
          <v-icon>{{ figureIcons[figure.type] }}</v-icon>
        </template>
      </v-select>

      <v-select
        :label="$t('$ezreeport.figures.slots')"
        :value="figure.slots || []"
        :items="availableSlots"
        :rules="rules.slots"
        multiple
        @change="onSlotUpdate"
      />
    </v-form>
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomFigure } from '~/lib/templates/customTemplates';
import { figureTypes, figureIcons } from '~/lib/templates/figures';
import useTemplateStore, { mapRulesToVuetify } from '~/stores/template';

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
    draggable: {
      type: Boolean,
      default: false,
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
    dataMap: {} as Record<string, string | unknown[] | undefined>,
    preventDrag: false,
    figureIcons,
  }),
  computed: {
    figure: {
      get(): AnyCustomFigure | undefined {
        const layout = this.templateStore.currentLayouts.find(
          ({ _: { id } }) => id === this.layoutId,
        );
        return layout?.figures.find(({ _: { id } }) => id === this.id);
      },
      set(val: AnyCustomFigure) {
        this.templateStore.UPDATE_FIGURE(this.layoutId, this.id, val);
      },
    },
    rules() {
      return mapRulesToVuetify(this.templateStore.rules.figures, (k) => this.$t(k));
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
      })).sort(
        (a, b) => a.label.toString().localeCompare(b.label.toString()),
      );
    },
    /**
     * Returns the title of the figure
     */
    figureTitle: {
      get(): string {
        const title = this.figure?.params?.title;
        if (title) {
          return title.toString();
        }

        return this.$t(`$ezreeport.figures.type_list.${this.figure?.type || 'unknown'}`).toString();
      },
      set(title: string) {
        if (!this.figure) {
          return;
        }

        this.figure = {
          ...this.figure,
          params: {
            ...this.figure.params,
            title,
          },
        };
      },
    },
  },
  methods: {
    onFigureTypeChange(type: string) {
      if (!this.figure) {
        return;
      }

      // Backup data for current type
      this.dataMap[this.figure.type] = this.figure.data;
      // Update type
      this.figure = {
        ...this.figure,
        data: this.dataMap[type],
        type,
      };
    },
    onFigureDelete() {
      this.templateStore.UPDATE_FIGURE(this.layoutId, this.id, undefined);
    },
    onDragAttempt(ev: DragEvent) {
      if (!(ev.target as HTMLElement).classList.contains('figure-handle')) {
        this.preventDrag = true;
      }
    },
    onSlotUpdate(slots: number[]) {
      if (!this.figure) {
        return;
      }

      this.figure = {
        ...this.figure,
        slots: slots.sort(),
      };
    },
    preventEvent(ev: Event) {
      ev.preventDefault();
      ev.stopPropagation();
      this.preventDrag = false;
    },
  },
});
</script>

<style scoped>
.figure-handle {
  cursor: grab;
}
</style>

<i18n lang="yaml">
en:
  figures:
    title: "Title"
fr:
  figures:
    title: 'Titre'
</i18n>
