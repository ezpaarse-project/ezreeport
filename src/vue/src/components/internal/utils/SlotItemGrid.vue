<template>
  <div :style="containerCSS" :class="['grid', isDragStarted && 'grid--dragged']">
    <div
      v-for="({ resolved, item }, i) in itemsWithCSS"
      :key="item._.id"
      :draggable="isDraggable"
      :style="resolved.css"
      class="slot"
      @dragstart.stop="onDragStart($event, item, i)"
      @dragend.stop="onDragEnd"
      @dragover.stop="onDragOver"
      @dragenter.stop="onDragEnter($event, resolved.slots[0])"
      @dragleave.stop="onDragLeave($event, resolved.slots[0])"
      @drop.stop="onDragDrop($event, resolved.slots, i)"
    >
      <slot
        name="item"
        :index="i"
        :item="item"
        :is-draggable="isDraggable"
        :is-hovered="isSlotDraggedOver[resolved.slots[0]]"
      />
    </div>

    <template v-if="unusedSlots.length">
      <v-sheet
        v-for="i in unusedSlots"
        :key="`dummy-${i}`"
        :class="[
          'slot',
          'slot--empty',
          isSlotDraggedOver[i] && 'slot--dragged primary--text',
        ]"
        outlined
        rounded
        @dragover.stop="onDragOver"
        @dragenter.stop="onDragEnter($event, i)"
        @dragleave.stop="onDragLeave($event, i)"
        @drop.stop="onDragDrop($event, [i])"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { CSSProperties } from 'vue/types/jsx';

type Item = { _: { id: string }, slots?: number[] };
type DragData = { index: number, item: Item };

const dragFormat = 'custom/grid-item-json';

export default defineComponent({
  props: {
    grid: {
      type: Object as PropType<{
        cols: number;
        rows: number;
      }>,
      default: () => ({ cols: 2, rows: 2 }),
    },
    items: {
      type: Array as PropType<Item[]>,
      default: () => [],
    },
    gap: {
      type: Number,
      default: 8,
    },
    showUnused: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    'update:items': (items: Item[]) => !!items,
  },
  data: () => ({
    isDragStarted: false,
    isSlotDraggedOver: {} as Record<number, boolean>,
  }),
  computed: {
    /**
     * Maximum count of items supported by grid
     */
    maxItemLength() {
      return this.grid.cols * this.grid.rows;
    },
    /**
     * CSS for container
     */
    containerCSS(): CSSProperties {
      return {
        gap: `${this.gap}px`,
        gridTemplate: `repeat(${this.grid.cols}, 1fr) / repeat(${this.grid.rows}, 1fr)`,
      };
    },
    /**
     * Item list with calculated position
     */
    itemsWithCSS() {
      return this.items.map((item, index) => {
        const resolved = this.slotsToCSS(item, index);
        return {
          item,
          resolved,
        };
      });
    },
    /**
     * Slots unused by items
     */
    unusedSlots() {
      if (!this.showUnused) {
        return [];
      }

      const usedSlots = new Set(this.itemsWithCSS.map(({ resolved: { slots } }) => slots).flat());

      return Array
        .from({ length: this.maxItemLength }, (_, i) => i)
        .filter((v) => !usedSlots.has(v));
    },
    /**
     * Are the child draggable
     */
    isDraggable() {
      return !!this.$listeners['update:items'];
    },
  },
  methods: {
    /**
     * Resolve slots into grid area when items specify slots
     *
     * @param rawSlots The slots specified by items
     * @param index The index of item in array
     */
    resolveManualSlots(rawSlots: number[], index: number) {
      const pos = {
        col: index % this.grid.cols,
        row: Math.floor(index / this.grid.cols),
        span: {
          cols: 1,
          rows: 1,
        },
      };
      const slots = [...new Set(rawSlots)];
      pos.col = slots[0] % this.grid.cols;
      pos.row = Math.floor(slots[0] / this.grid.cols);
      // Every slot on same row
      if (slots.every(
        (s) => Math.floor(s / this.grid.cols) === Math.floor(slots[0] / this.grid.cols),
      )) {
        pos.span.cols = slots.length;
      }
      // Every slot on same col
      if (slots.every((s) => s % this.grid.cols === slots[0] % this.grid.cols)) {
        pos.span.rows = slots.length;
      }
      // TODO: Support complex squares
      if (slots.length === this.maxItemLength) {
        pos.span = { ...this.grid };
      }
      return { slots, pos };
    },
    /**
     * Resolve item slots into usable CSS properties
     *
     * @param item The item
     * @param index The index of item in array
     */
    slotsToCSS({ slots }: Item, index: number): {
      css: CSSProperties;
      slots: number[];
    } {
      if (index >= this.maxItemLength) {
        return { slots: [], css: { display: 'none' } };
      }
      const res = this.resolveManualSlots(slots ?? [], index);

      return {
        slots: res.slots,
        css: {
          gridColumn: `${res.pos.col + 1}/span ${res.pos.span.cols}`,
          gridRow: `${res.pos.row + 1}/span ${res.pos.span.rows}`,
        },
      };
    },
    /**
     * Update inner dragged over state
     *
     * @param slot The slot
     * @param value The value
     */
    updateSlotDragOver(slot: number, value: boolean) {
      this.isSlotDraggedOver = { ...this.isSlotDraggedOver, [slot]: value };
    },
    /**
     * Init dragged data
     *
     * @param ev The event
     * @param item The dragged item
     * @param index The index of the dragged item
     */
    onDragStart(ev: DragEvent, item: Item, index: number) {
      if (this.isDraggable) {
        this.isDragStarted = true;
        ev.dataTransfer?.setData(
          dragFormat,
          JSON.stringify({
            index,
            item,
          }),
        );
      }
    },
    /**
     * Update inner dragged state
     */
    onDragEnd() {
      if (this.isDraggable) {
        this.isDragStarted = false;
      }
    },
    /**
     * Allow dropping on this element
     *
     * @param ev The event
     */
    onDragOver(ev: DragEvent) {
      if (this.isDraggable && ev.dataTransfer?.types.includes(dragFormat)) {
        ev.preventDefault();
      }
    },
    /**
     * Update inner dragged over state that current slot is hovered
     *
     * @param ev The event
     * @param slot The slot
     */
    onDragEnter(ev: DragEvent, slot: number) {
      if (this.isDraggable && ev.dataTransfer?.types.includes(dragFormat)) {
        this.updateSlotDragOver(slot, true);
      }
    },
    /**
     * Update inner dragged over state that current slot is no longer hovered
     *
     * @param ev The event
     * @param slot The slot
     */
    onDragLeave(ev: DragEvent, slot: number) {
      if (this.isDraggable && ev.dataTransfer?.types.includes(dragFormat)) {
        this.updateSlotDragOver(slot, false);
      }
    },
    /**
     * End dragging data
     *
     * @param ev The event
     * @param slots The slots of the target
     * @param targetIndex The index of the target
     */
    onDragDrop(ev: DragEvent, slots: number[], targetIndex?:number) {
      const data = ev.dataTransfer?.getData(dragFormat);
      if (this.isDraggable && data) {
        this.updateSlotDragOver(slots[0], false);

        const { index, item } = JSON.parse(data) as DragData;

        const items = [...this.items];
        if (targetIndex !== undefined) {
          // Swap with actual item
          const swap = { ...items[targetIndex] };
          swap.slots = item.slots ?? [0];
          items.splice(targetIndex, 1, swap);
        }

        item.slots = slots;
        items.splice(index, 1, item);

        this.$emit('update:items', items);

        ev.dataTransfer?.clearData(dragFormat);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.grid {
  height: 100%;
  display: grid;

  .slot {
    position: relative;
    transition: border-color 0.25s;

    &--empty {
      border-style: dashed;
      min-height: 1rem;
      height: 100%;
    }

    &--dragged {
      border-color: currentColor;
    }
  }

  &--dragged {
    .slot::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      z-index: 1;
    }
  }
}

</style>
