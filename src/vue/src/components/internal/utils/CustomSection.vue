<template>
  <v-sheet
    rounded
    outlined
    class="my-2 pa-2"
  >
    <div class="d-flex align-center" v-if="label || $slots.actions">
      <slot name="collapse" v-if="collapsable">
        <v-btn
          :disabled="collapseDisabled"
          icon
          x-small
          @click="collapsed = !collapsed"
        >
          <v-icon>mdi-chevron-{{ collapsed === false ? 'up' : 'down' }}</v-icon>
        </v-btn>
      </slot>

      <span class="text--secondary mx-1">{{ label }}</span>

      <slot name="actions" />
    </div>

    <slot v-if="!collapsed" />
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    label: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    collapsable: {
      type: Boolean,
      default: false,
    },
    collapseDisabled: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (value: boolean) => value !== undefined,
  },
  data: (vm) => ({
    innerCollapsed: vm.defaultValue || false,
  }),
  computed: {
    collapsed: {
      get(): boolean {
        return this.value ?? this.innerCollapsed;
      },
      set(value: boolean) {
        if (this.value != null) {
          this.$emit('input', value);
          return;
        }
        this.innerCollapsed = value;
      },
    },
  },
});
</script>
