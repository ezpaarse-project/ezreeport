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
        <FigureTitleAutocomplete
          v-else
          :value="figure?.params?.title?.toString() || ''"
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
        hide-details
        class="my-2"
        @change="onFigureTypeChange"
      >
        <template #prepend>
          <v-icon>{{ figureIcons[figure.type] || 'mdi-help' }}</v-icon>
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

      <div class="d-flex">
        <v-spacer />

        <v-btn color="error" small @click="onFigureDelete">
          {{ $t('$ezreeport.delete') }}

          <v-icon right>mdi-delete</v-icon>
        </v-btn>
      </div>
    </v-form>
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomFigure } from '~/lib/templates/customTemplates';
import { figureIcons, figureTypes } from '~/lib/templates/figures';
import useTemplateStore, { mapRulesToVuetify } from '~/stores/template';
import type { SelectItem } from '~/types/vuetify';

type BackupFigure = Pick<AnyCustomFigure, 'data' | 'params' | 'fetchOptions'>;

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
    previousDataForType: {} as Record<string, BackupFigure>,
    preventDrag: false,
    innerTitle: '',
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
    figure: {
      get(): AnyCustomFigure | undefined {
        return this.figures?.at(this.index ?? -1);
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
  mounted() {
    this.innerTitle = this.figure?.params?.title?.toString() ?? '';
  },
  methods: {
    async onAutocompleteChoice(choice: string) {
      if (choice) {
        const actual = this.innerTitle ?? '';
        await this.$nextTick();
        this.innerTitle = actual + choice;
        (this.$refs.titleCB as HTMLElement)?.focus();
      }
    },
    onFigureTypeChange(type: string) {
      if (!this.figure) {
        return;
      }

      // Backup data for current type
      this.previousDataForType[this.figure.type] = {
        data: this.figure.data,
        params: this.figure.params,
        fetchOptions: this.figure.fetchOptions,
      };

      let newFigure: BackupFigure = {
        data: undefined,
        params: {},
        fetchOptions: undefined,
      };
      if (this.previousDataForType[type]) {
        newFigure = { ...this.previousDataForType[type] };
      }

      // Update type
      this.figure = {
        ...this.figure,
        ...newFigure,
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
    title: 'Title'
fr:
  figures:
    title: 'Titre'
</i18n>
