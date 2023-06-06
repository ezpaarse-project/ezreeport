<template>
  <div v-if="value.length > 0">
    <ElasticAggElementDialog
      v-if="selectedAggElement"
      v-model="elementDialogShown"
      :element="selectedAggElement"
      :element-index="selectedIndex"
      :readonly="readonly"
      @update:element="onElementEdited"
    />

    <v-chip-group column>
      <v-chip
        v-for="(item, i) in value"
        :key="item.name || `agg${i}`"
        :close="!readonly"
        label
        outlined
        @click="openDialog(i, $event)"
        @click:close="!readonly && onElementDeleted(i)"
      >
        {{item.name || `agg${i}`}}
      </v-chip>
    </v-chip-group>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    /**
     * Aggregations
     */
    value: {
      type: Array as PropType<Record<string, any>[]>,
      required: true,
    },
    /**
     * Should be readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    /**
     * Triggered on any change in aggregations
     *
     * @param val The new aggregations
     */
    input: (val: Record<string, any>[]) => !!val,
  },
  data: () => ({
    elementDialogShown: false,
    elementDialogCoords: { x: 0, y: 0 },

    selectedIndex: -1,
  }),
  computed: {
    /**
     * Currently selected agg element
     */
    selectedAggElement(): Record<string, any> | undefined {
      return this.value[this.selectedIndex];
    },
  },
  methods: {
    /**
     * Prepare and open element dialog
     *
     * @param index the index of chip
     * @param event The base event
     */
    async openDialog(i: number, event: MouseEvent) {
      this.selectedIndex = i;
      this.elementDialogCoords = {
        x: event.clientX,
        y: event.clientY,
      };
      await this.$nextTick();
      this.elementDialogShown = true;
    },
    /**
     * Update agg value when a element is created
     *
     * Note: called by parent via ref
     */
    async onElementCreated() {
      this.$emit('input', [...this.value, { name: `agg${this.value.length}` }]);
      await this.$nextTick();
      this.selectedIndex = this.value.length;
    },
    /**
     * Update agg value when a element is edited
     *
     * @param index The index
     * @param element The element
     */
    onElementEdited(index: number, element: Record<string, any>) {
      const elements = [...this.value];
      elements.splice(index, 1, element);
      this.$emit('input', elements);
    },
    /**
     * Update agg value when a element is deleted
     *
     * @param index The index
     */
    onElementDeleted(index: number) {
      const elements = [...this.value];
      elements.splice(index, 1);
      this.$emit('input', elements);
    },
  },
});
</script>

<style scoped>

</style>
