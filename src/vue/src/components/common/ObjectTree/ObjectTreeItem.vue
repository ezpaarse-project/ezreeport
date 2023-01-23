<template>
  <li>
    <v-btn v-if="isObject || isArray" icon @click="collapsed = !collapsed" x-small class="collapse-btn">
      <v-icon>mdi-chevron-{{ collapsed === false ? 'up' : 'down' }}</v-icon>
    </v-btn>

    <div class="d-flex align-end mt-1">
      <span class="font-italic">{{ property }}:</span>

      <div class="ml-1" style="flex: 1">
        <div v-if="isBoolean || isNumber || isString">
          <v-switch v-if="isBoolean" :input-value="value" dense readonly hide-details class="mt-0" />

          <v-text-field
            v-else-if="isNumber || isString"
            :type="isNumber ? 'number' : 'text'"
            :value="value"
            placeholder="Value"
            dense
            readonly
            hide-details />
        </div>

        <div v-else class="font-italic text--disabled">
          {{ value.constructor.name }}
        </div>
      </div>
    </div>

    <ObjectTree v-if="!collapsed && (isObject || isArray)" :value="value" />
  </li>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  name: 'ObjectTreeItem',
  props: {
    property: {
      type: [String, Number],
      required: true,
    },
    value: {
      type: [] as PropType<any>,
      required: true,
    },
  },
  data: () => ({
    collapsed: true,
  }),
  computed: {
    entries() {
      return Object
        .entries(this.value)
        .filter(([, value]) => value !== undefined && value !== null);
    },
    isNull() {
      return this.value === undefined || this.value === null;
    },
    isArray() {
      return !this.isNull && Array.isArray(this.value);
    },
    isObject() {
      return !this.isNull && !this.isArray && typeof this.value === 'object';
    },
    isNumber() {
      return !this.isNull && typeof this.value === 'number';
    },
    isBoolean() {
      return !this.isNull && typeof this.value === 'boolean';
    },
    isString() {
      return !this.isNull && typeof this.value === 'string';
    },
  },
});
</script>

<style scoped lang="scss">
.collapse-btn {
  margin-left: 4px;
  align-self: center;
  position: absolute;
  left: -1.75rem;
}
</style>
