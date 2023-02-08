<template>
  <div>
    <LayoutDialogParams
      v-if="selectedLayout"
      v-model="paramsLayoutDialogShown"
      :layout="selectedLayout"
      :index="value"
      :readonly="mode === 'view'"
      @update:layout="onLayoutUpdate"
      @update:index="selectedLayout && onLayoutPositionUpdate(selectedLayout, $event)"
    />

    <draggable
      :value="items"
      :move="onLayoutMove"
      :disabled="mode === 'view'"
      draggable=".draggable"
      @change="onLayoutDragged"
    >
      <div
        v-for="(layout, i) in items"
        :key="layout._.id"
        class="draggable"
      >
        <div class="d-flex">
          <span :class="[value === i && 'primary--text']">
            #{{ i }}
            <v-icon v-if="layout._.hasError" color="warning" small>mdi-alert</v-icon>
          </span>

          <v-spacer />

          <template v-if="layout.at !== undefined">
            <v-btn icon color="error" x-small @click="onLayoutDelete(layout)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>

            <v-btn icon x-small @click="showLayoutParams(i)">
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
            class="layout-preview mb-3"
            @click="$emit('input', i)"
          />
        </v-hover>
      </div>

      <template #footer>
        <div class="layout-preview">
          <v-tooltip>
            <template #activator="{ attrs, on }">
              <v-btn
                fab
                v-bind="attrs"
                @click="onLayoutCreate"
                v-on="on"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>

            <span>{{ $t('actions.add-layout') }}</span>
          </v-tooltip>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts">
import draggable, { type MoveEvent } from 'vuedraggable';
import { defineComponent, type PropType } from 'vue';
import { addAdditionalData, type AnyCustomLayout } from './customTemplates';

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
  },
  emits: {
    input: (val: number) => !!val,
    'update:items': (val: AnyCustomLayout[]) => val.length >= 0,
  },
  data: () => ({
    paramsLayoutDialogShown: false,
  }),
  computed: {
    /**
     * The current layout selected
     */
    selectedLayout() {
      return this.items[this.value];
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
     * Show params dialog for given layout
     *
     * @param index The index of the layout in the template/task
     */
    showLayoutParams(index: number) {
      this.$emit('input', index);
      this.paramsLayoutDialogShown = true;
    },
  },
});
</script>

<style lang="scss" scoped>
.layout-preview {
  display: flex;
  align-items: center;
  justify-content: center;

  aspect-ratio: 297/210; // A4 format in mm
  cursor: pointer;

  transition: background-color 0.5s, border-color 0.5s;
}
</style>

<i18n lang="yaml">
en:
  actions:
    add-layout: 'Add layout'
fr:
  actions:
    add-layout: 'Ajouter une page'
</i18n>
