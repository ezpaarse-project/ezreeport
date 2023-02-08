<template>
  <div>
    <ObjectTreePropertyDialog v-if="$listeners.input" ref="propertyDialogRef" />

    <span v-if="label" class="text--secondary">
      <v-btn
        :disabled="length <= 0"
        icon
        x-small
        @click="collapsed = !collapsed"
      >
        <v-icon>mdi-chevron-{{ collapsed === false ? 'up' : 'down' }}</v-icon>
      </v-btn>
      {{ label }}

      <v-btn
        v-if="$listeners.input"
        icon
        x-small
        color="success"
        @click="addField"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </span>
    <ObjectTree
      v-if="!collapsed"
      :value="value"
      :dialog-ref="$refs.propertyDialogRef"
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
      return {
        input: this.$listeners.input
          ? (v: Record<string, any> | unknown[]) => this.$emit('input', v)
          : undefined,
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
