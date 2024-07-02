<template>
  <div>
    <ObjectTreePropertyPopover v-if="$listeners.input" ref="propertyPopoverRef" />

    <div v-if="label" class="text--secondary d-flex align-center">
      {{ label }}

      <v-btn
        v-if="$listeners.input && (!collapsed || length <= 0)"
        icon
        x-small
        color="success"
        @click="addField"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>

      <v-spacer />

      <v-btn
        :disabled="length <= 0"
        icon
        x-small
        @click="collapsed = !collapsed"
      >
        <v-icon>mdi-chevron-{{ collapsed === false ? 'up' : 'down' }}</v-icon>
      </v-btn>
    </div>
    <ObjectTree
      v-if="!collapsed"
      :value="value"
      :popover-ref="$refs.propertyPopoverRef"
      v-on="treeListeners"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: [Object, Array],
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  emits: {
    input: (v: Record<string, any> | unknown[]) => !!v,
  },
  data: () => ({
    collapsed: true,
  }),
  computed: {
    length() {
      return Object.keys(this.value).length;
    },
    treeListeners() {
      if (!this.$listeners.input) {
        return {};
      }
      return {
        input: (v: Record<string, any> | unknown[]) => this.$emit('input', v),
      };
    },
  },
  methods: {
    /**
     * Add a new field to the object/array
     */
    addField() {
      this.collapsed = false;
      if (Array.isArray(this.value)) {
        // Creating value based on previous type
        const val = this.value.at(-1)?.constructor() ?? '';
        this.$emit('input', [...this.value, val]);
      } else {
        const index = Object.keys(this.value).length;
        this.$emit('input', { ...this.value, [`key-${index}`]: '' });
      }
    },
  },
});
</script>

<style scoped lang="scss">
</style>
