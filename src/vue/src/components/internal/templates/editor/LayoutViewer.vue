<template>
  <div class="d-flex flex-column">
    <FigureDialogParams
      v-if="editedFigureId && isFigureDialogParamsShown"
      v-model="isFigureDialogParamsShown"
      :id="editedFigureId"
      :layout-id="value"
      :readonly="mode !== 'allowed-edition'"
    />

    <div :class="['d-flex align-center pa-2', $vuetify.theme.dark ? 'grey darken-4' : 'white']">
      {{$t('headers.page', { pageNumber: index + 1 })}}

      <v-spacer />

      <v-tooltip top v-if="mode !== 'view'">
        <template #activator="{ attrs, on }">
          <v-btn
            :disabled="!canCreate"
            small
            icon
            color="success"
            @click="onFigureCreate"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>

        <span>{{$t('actions.create-tooltip')}}</span>
      </v-tooltip>
    </div>

    <v-divider />

    <div class="pa-2" style="height: 100%;">
      <SlotItemGrid
        :items="figures"
        :grid="templateStore.currentGrid"
        show-unused
        v-on="gridListeners"
      >
        <template
          #item="{ isDraggable, isHovered, item: figure }"
        >
          <FigureDetail
            v-if="mode !== 'allowed-edition'"
            :id="figure._.id"
            :layout-id="value"
            :taken-slots="takenSlots"
            :class="[
              'figure-slot',
              isHovered && 'figure-slot--hovered primary--text',
            ]"
            @edit:figure="openFigureDialogParams"
          />
          <FigureForm
            v-else
            :id="figure._.id"
            :layout-id="value"
            :taken-slots="takenSlots"
            :draggable="isDraggable"
            :class="[
              'figure-slot',
              isHovered && 'figure-slot--hovered primary--text',
            ]"
            @edit:figure="openFigureDialogParams"
          />
        </template>
      </SlotItemGrid>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { addAdditionalData, type AnyCustomFigure } from '~/lib/templates/customTemplates';
import useTemplateStore from '~/stores/template';

export default defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
    mode: {
      type: String as PropType<'view' | 'allowed-edition' | 'denied-edition'>,
      default: 'view',
    },
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    isFigureDialogParamsShown: false,
    editedFigureId: undefined as string | undefined,
  }),
  computed: {
    index(): number {
      return this.templateStore.currentLayouts.findIndex(
        ({ _: { id } }) => id === this.value,
      );
    },
    figures: {
      get(): AnyCustomFigure[] {
        return this.templateStore.currentLayouts[this.index]?.figures ?? [];
      },
      set(figures: AnyCustomFigure[]) {
        const layout = this.templateStore.currentLayouts[this.index] ?? {};
        this.templateStore.UPDATE_LAYOUT(this.value, { ...layout, figures });
      },
    },
    /**
     * The slots taken by the figures
     */
    takenSlots(): number[] {
      return this.figures.reduce(
        (taken, { slots }) => (slots ? [...taken, ...slots] : taken),
        [] as number[],
      );
    },
    /**
     * Listeners for figure grid
     */
    gridListeners() {
      if (this.mode !== 'allowed-edition') {
        return {};
      }
      return {
        'update:items': this.onFigureListUpdate,
      };
    },
    canCreate() {
      // eslint-disable-next-line prefer-destructuring
      const grid = this.templateStore.currentGrid;

      return this.takenSlots.length < grid.cols * grid.rows && this.mode === 'allowed-edition';
    },

  },
  methods: {
    /**
     * TS wrapper for updating figure list
     *
     * @param items the figure list
     */
    onFigureListUpdate(items: { slots?: number[] }[]) {
      this.figures = items as AnyCustomFigure[];
    },
    /**
     * Add a new figure in current layout
     */
    onFigureCreate() {
      if (this.mode !== 'allowed-edition') {
        return;
      }

      // Resolve the first unused slot
      const grid = this.templateStore.currentGrid;
      const maxElements = grid.cols * grid.rows;
      const usedSlots = new Set(this.takenSlots);
      let firstUnusedSlot = 0;
      for (firstUnusedSlot = 0; firstUnusedSlot < maxElements; firstUnusedSlot += 1) {
        if (!usedSlots.has(firstUnusedSlot)) {
          break;
        }
      }

      // Since slot overflow can still occur (if there's no space left) and cause too much errors
      if (firstUnusedSlot >= maxElements) {
        return;
      }

      const defaultFigure: AnyCustomFigure = addAdditionalData({
        type: 'md',
        params: {},
        slots: [firstUnusedSlot],
      });
      this.figures = [...this.figures, defaultFigure];
    },
    /**
     * Prepare and opens figure params
     */
    async openFigureDialogParams(id: string) {
      this.editedFigureId = id;
      await this.$nextTick();
      this.isFigureDialogParamsShown = true;
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
  headers:
    page: 'Figures of Page {pageNumber}'
  actions:
    create-tooltip: 'Add a figure'
fr:
  headers:
    page: 'Visualisations de la Page {pageNumber}'
  actions:
    create-tooltip: 'Ajouter une visualisation'
</i18n>
