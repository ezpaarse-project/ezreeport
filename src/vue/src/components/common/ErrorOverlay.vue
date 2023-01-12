<template>
  <v-fade-transition>
    <v-overlay
      v-if="error"
      :color="color"
      absolute
    >
      {{ error }}
    </v-overlay>
  </v-fade-transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    error: {
      type: String,
      default: '',
    },
  },
  data: (vm) => ({
    color: vm.$vuetify.theme.currentTheme.error,
  }),
});
</script>

<style scoped>

</style>
