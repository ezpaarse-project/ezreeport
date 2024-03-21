<template>
  <v-chip
    :color="color"
    :style="{ color: textColor }"
    :disabled="disabled"
    class="readable-chip"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot />
  </v-chip>
</template>

<script lang="ts">
import { contrast } from 'chroma-js';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    color: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    disabled: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
  },
  computed: {
    textColor(): string | undefined {
      if (!this.color) {
        return undefined;
      }

      return contrast(this.color, 'black') > 5 ? 'black' : 'white';
    },
  },
});
</script>

<style scoped>
.readable-chip {
  transition-property: box-shadow, opacity, background-color, color;
}
</style>
