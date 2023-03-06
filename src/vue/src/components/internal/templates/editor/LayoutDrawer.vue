<template>
  <div class="layout-drawer-container">
    <LayoutPopoverParams
      v-if="selectedLayout"
      v-model="paramsLayoutPopoverShown"
      :layout="selectedLayout"
      :index="value"
      :readonly="mode === 'view'"
      :coords="paramsLayoutPopoverCoords"
      @update:layout="onLayoutUpdate"
      @update:index="selectedLayout && onLayoutPositionUpdate(selectedLayout, $event)"
    />

    <div class="d-flex flex-column" style="width: 100%;">
      <template v-if="mode !== 'view'">
        <!-- Toolbar -->
        <div class="d-flex pa-2" style="min-height: 44px;">
          <v-btn
            small
            color="success"
            elevation="0"
            @click="onLayoutCreate"
          >
            <v-icon left>mdi-plus</v-icon>
            {{ $t('actions.add') }}
          </v-btn>
        </div>

        <v-divider />
      </template>

      <!-- Items -->
      <draggable
        :value="items"
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
          v-for="(layout, i) in items"
          :key="layout._.id"
          class="drawer-item--draggable"
        >
          <div class="d-flex">
            <span :class="[value === i && 'primary--text']">
              #{{ i }}
              <v-icon v-if="errorMap.get(layout._.id)" color="warning" small>mdi-alert</v-icon>
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

              <v-btn icon x-small @click="showLayoutParamsPopover(i, $event)">
                <v-icon>mdi-cog</v-icon>
              </v-btn>
            </template>
            <template v-else>
              <v-icon color="black" dense>mdi-lock</v-icon>
            </template>
          </div>

          <v-hover v-slot="{ hover }">
            <v-sheet
              :color="(value === i && 'primary')
                || (hover && 'grey')
                || undefined"
              rounded
              outlined
              class="layout-preview mb-3 pa-2"
              @click="$emit('input', i)"
            >
              <SlotItemGrid
                :items="layout.figures"
                :grid="grid"
              >
                <template #item="{ item: figure }">
                  <v-sheet
                    class="figure-preview"
                    rounded
                    outlined
                  >
                    <v-icon :large="layout.figures.length <= 2">
                      {{ figureIcons[figure.type] }}
                    </v-icon>
                  </v-sheet>
                </template>
              </SlotItemGrid>
            </v-sheet>
          </v-hover>
        </div>
      </draggable>
    </div>
  </div>
</template>

<script lang="ts">
import draggable, { type MoveEvent } from 'vuedraggable';
import { defineComponent, type PropType } from 'vue';
import { addAdditionalData, type AnyCustomLayout } from '~/lib/templates/customTemplates';
import { figureIcons } from '~/lib/templates/figures';

export default defineComponent({
  components: {
    draggable,
  },
  props: {
    value: {
      type: Number,
      required: true,
    },
    items: {
      type: Array as PropType<AnyCustomLayout[]>,
      required: true,
    },
    mode: {
      type: String as PropType<'view' | 'task-edition' | 'template-edition'>,
      default: 'view',
    },
    grid: {
      type: Object as PropType<{ rows: number, cols: number }>,
      default: () => ({ cols: 2, rows: 2 }),
    },
  },
  emits: {
    input: (val: number) => !!val,
    'update:items': (val: AnyCustomLayout[]) => val.length >= 0,
  },
  data: () => ({
    paramsLayoutPopoverShown: false,
    paramsLayoutPopoverCoords: {
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
      return this.items[this.value];
    },
    /**
     * Validate every layout
     */
    errorMap(): Map<string, boolean> {
      const errorMap = new Map<string, boolean>();

      // eslint-disable-next-line no-restricted-syntax
      for (const layout of this.items) {
        const isLayoutEmpty = layout.figures.length === 0;

        const isLayoutManual = layout.figures.every(({ slots }) => !!slots);
        const isLayoutAuto = layout.figures.every(({ slots }) => !slots);
        const isLayoutMixed = (isLayoutManual === isLayoutAuto);

        const hasError = layout._.hasError || isLayoutEmpty || isLayoutMixed;
        errorMap.set(layout._.id, hasError);
      }

      return errorMap;
    },
  },
  methods: {
    /**
     * Update a layout in current template
     *
     * @param value The new layout
     */
    onLayoutUpdate(value: AnyCustomLayout) {
      const index = this.items.findIndex(({ _: { id } }) => id === value._.id);

      if (this.mode === 'view' || !this.items[index]) {
        return;
      }

      const items = [...this.items];
      items.splice(index, 1, value);
      this.$emit('update:items', items);
    },
    /**
     * Update a layout position in current template
     *
     * @param layout The layout
     * @param value The new index
     */
    onLayoutPositionUpdate(layout: AnyCustomLayout, value: number) {
      const index = this.items.findIndex(({ _: { id } }) => id === layout._.id);

      if (this.mode === 'view' || !this.items[index]) {
        return;
      }

      const items = [...this.items];

      if (this.mode === 'task-edition') {
        const item = { ...items[index] };
        item.at = value;
        items.splice(index, 1, item);
      }

      if (this.mode === 'template-edition') {
        // Delete current position
        items.splice(index, 1);
        // Insert at new position
        items.splice(value, 0, layout);
      }

      this.$emit('update:items', items);
      if (this.selectedLayout._.id === layout._.id) {
        this.$emit('input', value);
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
    onLayoutCreate() {
      if (this.mode === 'view') {
        return;
      }

      const defaultLayout: AnyCustomLayout = addAdditionalData({ figures: [] });
      if (this.mode === 'task-edition') {
        defaultLayout.at = this.items.length;
      }

      this.$emit('update:items', [...this.items, defaultLayout]);
      // Select created template
      this.$emit('input', this.items.length);

      // Scroll to bottom
      this.$nextTick(() => {
        const el = (this.$refs.drawerRef as Vue).$el;
        el.scrollTop = el.scrollHeight;
      });
    },
    /**
     * Delete a layout in current template
     *
     * @param layout The layout
     */
    onLayoutDelete(layout: AnyCustomLayout) {
      const index = this.items.findIndex(({ _: { id } }) => id === layout._.id);
      if (this.mode === 'view' || !this.items[index]) {
        return;
      }
      const items = [...this.items];
      items.splice(index, 1);
      this.$emit('update:items', items);

      if (this.value > 0 && (layout.at ?? index) <= this.value) {
        // Select previous layout
        this.$emit('input', this.value - 1);
      }
    },
    /**
     * Show params popover for given layout
     *
     * @param index The index of the layout in the template/task
     * @param event The base event
     */
    async showLayoutParamsPopover(index: number, event: MouseEvent) {
      this.$emit('input', index);
      this.paramsLayoutPopoverCoords = {
        x: event.clientX,
        y: event.clientY,
      };
      await this.$nextTick();
      this.paramsLayoutPopoverShown = true;
    },
  },
});
</script>

<style lang="scss" scoped>
.layout-drawer-container {
  position: relative;
  width: 20%;
  height: 100%;
  display: flex;

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
  actions:
    add: 'Add'
fr:
  actions:
    add: 'Ajouter'
</i18n>
