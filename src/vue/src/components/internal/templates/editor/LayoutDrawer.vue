<template>
  <div class="layout-drawer-container">
    <LayoutParamsPopover
      v-if="selectedLayout"
      v-model="paramsLayoutDialogShown"
      :coords="paramsLayoutDialogCoords"
      :id="value"
      :readonly="mode === 'view'"
    />

    <div class="d-flex flex-column">
      <!-- Toolbar -->
      <div :class="['d-flex align-center pa-2', $vuetify.theme.dark ? 'grey darken-4' : 'white']">
        {{ $t('headers.layouts') }}

        <v-spacer />

        <v-tooltip v-if="mode !== 'view'" top>
          <template #activator="{ attrs, on }">
            <v-btn
              small
              icon
              color="success"
              v-bind="attrs"
              @click="onLayoutCreate"
              v-on="on"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>

          <span>{{$t('actions.create-tooltip')}}</span>
        </v-tooltip>
      </div>

      <v-divider />

      <!-- Items -->
      <Draggable
        :value="templateStore.currentLayouts"
        :move="onLayoutMove"
        :disabled="mode === 'view'"
        :component-data="{
          attrs: {
            class: 'drawer px-3',
          },
        }"
        ref="drawerRef"
        draggable=".drawer-item--draggable"
        @change="onLayoutDragged"
      >
        <div
          v-for="(layout, i) in templateStore.currentLayouts"
          :key="layout._.id"
          class="drawer-item--draggable"
        >
          <div class="d-flex">
            <span :class="[value === layout._.id && 'primary--text']">
              #{{ i + 1 }}

              <v-tooltip top v-if="layout._.valid !== true" color="warning">
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

                <span>{{ validationMap.get(layout._.id) }}</span>
              </v-tooltip>
            </span>

            <v-spacer />

            <template v-if="mode !== 'task-edition' || layout.at !== undefined">
              <v-btn
                v-if="mode !== 'view'"
                icon
                color="error"
                x-small
                @click="onLayoutDelete(layout)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>

              <v-btn icon x-small @click="showLayoutParamsDialog(layout._.id, $event)">
                <v-icon>mdi-cog</v-icon>
              </v-btn>
            </template>
            <template v-else>
              <v-icon color="black" dense>mdi-lock</v-icon>
            </template>
          </div>

          <v-hover v-slot="{ hover }">
            <v-sheet
              :color="(value === layout._.id && 'primary')
                || (hover && 'grey')
                || undefined"
              rounded
              outlined
              class="layout-preview mb-3 pa-2"
              @click="$emit('input', layout._.id)"
            >
              <SlotItemGrid
                :items="layout.figures"
                :grid="templateStore.currentGrid"
              >
                <template #item="{ item: figure }">
                  <v-sheet
                    class="figure-preview"
                    rounded
                    outlined
                  >
                    <v-icon :large="layout.figures.length <= 2">
                      {{ figureIcons[figure.type] || 'mdi-help' }}
                    </v-icon>
                  </v-sheet>
                </template>
              </SlotItemGrid>
            </v-sheet>
          </v-hover>
        </div>
      </Draggable>
    </div>
  </div>
</template>

<script lang="ts">
import Draggable, { type MoveEvent } from 'vuedraggable';
import { defineComponent, type PropType } from 'vue';
import { addAdditionalData, type AnyCustomLayout } from '~/lib/templates/customTemplates';
import { figureIcons } from '~/lib/templates/figures';
import useTemplateStore from '~/stores/template';

export default defineComponent({
  components: {
    Draggable,
  },
  props: {
    value: {
      type: String,
      required: true,
    },
    mode: {
      type: String as PropType<'view' | 'task-edition' | 'template-edition'>,
      default: 'view',
    },
  },
  emits: {
    input: (val: string) => !!val,
    'update:items': (val: AnyCustomLayout[]) => val.length >= 0,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    paramsLayoutDialogShown: false,
    paramsLayoutDialogCoords: {
      x: 0,
      y: 0,
    },

    figureIcons,
    collapsed: false,
  }),
  computed: {
    /**
     * The current layout selected
     */
    selectedLayout() {
      return this.templateStore.currentLayouts.find(({ _: { id } }) => id === this.value);
    },
    validationMap() {
      return new Map<string, string | true>(
        this.templateStore.currentLayouts.map(
          (l) => {
            if (l._.valid === true) {
              return [l._.id, true];
            }
            let error = this.$t(l._.valid.i18nKey);
            if (l._.valid.figure !== undefined) {
              error = this.$t('errors.figures._detail', { at: l._.valid.figure, valid: error });
            }
            return [l._.id, error.toString()];
          },
        ),
      );
    },
  },
  methods: {
    /**
     * Update a layout position in current template
     *
     * @param layout The layout
     * @param newIndex The new index
     */
    onLayoutPositionUpdate(layout: AnyCustomLayout, newIndex: number) {
      if (this.mode === 'view') {
        return;
      }

      if (this.mode === 'task-edition') {
        const item = { ...layout };
        item.at = newIndex;
        this.templateStore.UPDATE_LAYOUT(layout._.id, item);
      }

      if (this.mode === 'template-edition') {
        // Delete current position
        this.templateStore.UPDATE_LAYOUT(layout._.id, undefined);
        // Insert at new position
        this.templateStore.ADD_LAYOUT(layout, newIndex);
      }
    },
    /**
     * Prevent locked items to be moved
     *
     * @param event the move callback event
     */
    onLayoutMove(e: MoveEvent<AnyCustomLayout>) {
      if (this.mode === 'task-edition') {
        return e.draggedContext.element.at !== undefined;
      }
      return this.mode === 'template-edition';
    },
    /**
     * Called when a element in the list is moved
     *
     * @param event The onChange draggable event
     */
    onLayoutDragged(event: DroppedEvent<AnyCustomLayout>) {
      if (this.mode !== 'view' && 'moved' in event) {
        this.onLayoutPositionUpdate(
          event.moved.element,
          event.moved.newIndex,
        );
      }
    },
    /**
     * Add a new layout to the current template
     */
    async onLayoutCreate() {
      if (this.mode === 'view') {
        return;
      }

      const defaultLayout: AnyCustomLayout = addAdditionalData({ figures: [] });

      if (this.mode === 'task-edition') {
        defaultLayout.at = this.templateStore.currentLayouts.length;
      }

      this.templateStore.ADD_LAYOUT(defaultLayout);
      this.$emit('input', defaultLayout._.id);

      // Scroll to bottom
      await this.$nextTick();
      const el = (this.$refs.drawerRef as Vue).$el;
      el.scrollTop = el.scrollHeight;
    },
    /**
     * Delete a layout in current template
     *
     * @param layout The layout
     */
    async onLayoutDelete(layout: AnyCustomLayout) {
      // const items = this.templateStore.currentLayouts;
      // const index = items.findIndex(({ _: { id } }) => id === layout._.id);
      if (this.mode === 'view') {
        return;
      }

      this.templateStore.UPDATE_LAYOUT(layout._.id, undefined);
    },
    /**
     * Show params dialog for given layout
     *
     * @param id The id of the layout
     * @param event The base event
     */
    async showLayoutParamsDialog(id: string, event: MouseEvent) {
      this.$emit('input', id);
      this.paramsLayoutDialogCoords = {
        x: event.clientX,
        y: event.clientY,
      };
      await this.$nextTick();
      this.paramsLayoutDialogShown = true;
    },
  },
});
</script>

<style lang="scss" scoped>
.layout-drawer-container {
  height: 100%;

  > .flex-column {
    height: 100%;
  }

  &::v-deep(.drawer) {
    flex: 1;
    overflow-y: auto;
  }
}

.layout-preview {
  align-items: center;
  justify-content: center;

  aspect-ratio: 297/210; // A4 format in mm
  cursor: pointer;

  transition: background-color 0.5s, border-color 0.5s;

  > * {
    height: 100%;
  }

  .figure-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
}
</style>

<i18n lang="yaml">
en:
  headers:
    layouts: 'Pages'
  actions:
    create-tooltip: 'Add a page'
  errors:
    empty: 'This field must be set'
    layouts:
      length: 'All pages must contains at least one figure'
    figures:
      _detail: 'Figure {at}: {valid}'
      slots: 'This combinaison of slots is not possible'
fr:
  headers:
    layouts: 'Pages'
  actions:
    create-tooltip: 'Ajouter une page'
  errors:
    empty: 'Ce champ doit être rempli'
    layouts:
      length: 'Chaque page doit contenir au moins une visualisation'
    figures:
      _detail: 'Visualisation {at}: {valid}'
      slots: "Cette combinaison d'emplacement n'est pas possible"
</i18n>
