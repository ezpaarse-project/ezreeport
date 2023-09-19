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
import chroma from 'chroma-js';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    color: {
      type: String,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: undefined,
    },
  },
  computed: {
    textColor(): string | undefined {
      if (!this.color) {
        return undefined;
      }

      return chroma.contrast(this.color, 'black') > 5 ? 'black' : 'white';
    },
  },
});
</script>

<style scoped>
.readable-chip {
  transition-property: box-shadow, opacity, background-color, color;
}
</style>
