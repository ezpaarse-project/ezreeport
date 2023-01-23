<template>
  <div>
    <span v-if="label" class="text--secondary">
      <v-btn icon @click="collpased = !collpased" x-small>
        <v-icon>mdi-chevron-{{ collpased === false ? 'up' : 'down' }}</v-icon>
      </v-btn>
      {{ label }}
    </span>
    <ObjectTree v-if="!collpased" :value="value" />
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
  data: () => ({
    collpased: true,
  }),
});
</script>

<style scoped lang="scss">
</style>
