<template>
  <v-tooltip>
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        :disabled="loading || disabled"
        v-bind="attrs"
        @click="$emit('click')"
        v-on="on"
      >
        <v-progress-circular
          v-if="loading"
          size="20"
          width="2"
          indeterminate
        />
        <v-icon v-else>
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
