<template>
  <v-tooltip top>
    <template #activator="{ on, attrs }">
      <v-btn
        :disabled="loading || disabled"
        :loading="loading"
        icon
        v-bind="attrs"
        @click="$emit('click')"
        v-on="on"
      >
        <v-icon>
          mdi-refresh
        </v-icon>
      </v-btn>
    </template>

    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: String,
      required: true,
    },
  },
  emits: {
    click: () => true,
  },
});
</script>

<style scoped>

</style>
