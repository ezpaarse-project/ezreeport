<template>
  <v-toolbar :elevation="elevation">
    <v-toolbar-title>{{ text }}</v-toolbar-title>

    <v-spacer />

    <slot />

    <v-progress-linear
      :active="loading"
      indeterminate
      absolute
      bottom
      color="primary"
    />
  </v-toolbar>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    elevation: {
      type: [String, Number],
      default: 0,
    },
  },
});
</script>

<style scoped>

</style>
