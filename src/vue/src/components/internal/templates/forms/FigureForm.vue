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

        {{ figureTitle }}

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

        <v-spacer />

        <v-btn icon color="error" x-small @click="onFigureDelete">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </div>

      <v-select
        :label="$t('headers.type')"
        :value="figure.type"
        :items="figureTypes"
        item-text="label"
        item-value="value"
        @change="onFigureTypeChange"
      >
        <template #prepend>
          <v-icon>{{ figureIcons[figure.type] }}</v-icon>
        </template>
      </v-select>

      <v-btn v-if="figureParamsForm" x-large block @click="isFigureDialogEditionShown = true">
        {{ $t('headers.configuration') }}
      </v-btn>

      <!-- TODO: choose if custom param -->
      <!-- <CustomSection v-else>
        <ToggleableObjectTree
          :label="$t('headers.data').toString()"
          :value="Array.isArray(figure.data) ? figure.data : []"
          @input="
            Array.isArray($event)
              && $emit('update:figure', { ...figure, data: $event })
          "
        />
      </CustomSection> -->

      <!-- <CustomSection
        v-if="figureParamsForm"
        :label="$t('headers.figureParams').toString()"
        collapsable
        style="background: transparent;"
      >
        <component
          :is="figureParamsForm"
          :value="figure.params || {}"
          @input="$emit('update:figure', { ...figure, params: $event })"
        />
      </CustomSection> -->

      <v-select
        :label="$t('headers.slots')"
        :value="figure.slots || []"
        :items="availableSlots"
        :rules="rules.slots"
        multiple
        @change="figure = { ...figure, slots: $event }"
      />
    </v-form>
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomFigure } from '~/lib/templates/customTemplates';
import { figureTypes, figureIcons } from '~/lib/templates/figures';
import figureFormMap from '~/components/internal/utils/figures';
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
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    dataMap: {} as Record<string, string | unknown[] | undefined>,
    preventDrag: false,
    isFigureDialogEditionShown: false,
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
        text: this.$t(`slots[${i}]`),
        value: i,
        disabled: takenSet.has(i) && !slotsSet.has(i),
      }));
    },
    /**
     * Localized figure types
     */
    figureTypes() {
      return figureTypes.map((value) => ({
        label: this.$t(`figure_types.${value}`),
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
      if (!this.figure) {
        return '';
      }

      const title = this.figure.params?.title;
      if (title) {
        return title;
      }

      return this.$t(`figure_types.${this.figure.type}`);
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
  headers:
    figure: '{type} Figure'
    type: 'Figure type'
    data: 'Figure data'
    figureParams: 'Figure params'
    slots: 'Figure slot(s)'
  figure_types:
    table: 'Table'
    md: 'Markdown'
    metric: 'Metrics'
    arc: 'Arc'
    area: 'Area'
    bar: 'Bar'
    line: 'Line'
    point: 'Point'
    rect: 'Rect'
    rule: 'Rule'
    text: 'Text'
    tick: 'Tick'
    trail: 'Trail'
    circle: 'Circle'
    square: 'Square'
  slots:
    - 'Top left'
    - 'Top right'
    - 'Bottom left'
    - 'Bottom right'
  errors:
    empty: 'This field must be set'
    layouts:
      _detail: 'Page {at}: {valid}'
      mixed: 'All figures must be placed the same way (auto or manually)'
      length: 'All pages must contains at least one figure'
    figures:
      _detail: 'Figure {at}: {valid}'
      slots: 'This combinaison of slots is not possible'
fr:
  headers:
    figure: 'Visualisation {type}'
    type: 'Type de visualisation'
    data: 'Données de la visualisation'
    figureParams: 'Paramètres de la visualisation'
    slots: 'Emplacements de la visualisation'
  figure_types:
    table: 'Table'
    md: 'Markdown'
    metric: 'Métriques'
    arc: 'Circulaire'
    area: 'Aire'
    bar: 'Bâtons'
    line: 'Courbes'
    point: 'Nuage de point'
    rect: 'Rectangle'
    rule: 'Règle'
    text: 'Texte'
    tick: 'Tick' # TODO French translation
    trail: 'Trail' # TODO French translation
    circle: 'Cercle'
    square: 'Carré'
  slots:
    - 'Haut à gauche'
    - 'Haut à droite'
    - 'Bas à gauche'
    - 'Bas à droite'
  errors:
    empty: 'Ce champ doit être rempli'
    layouts:
      _detail: 'Page {at}: {valid}'
      mixed: 'Toutes les visualisations doivent être placée de la même façon (auto ou manuellement)'
      length: 'Chaque page doit contenir au moins une visualisation'
    figures:
      _detail: 'Visualisation {at}: {valid}'
      slots: "Cette combinaison d'emplacement n'est pas possible"
</i18n>
