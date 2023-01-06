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
import { colors } from 'vuetify/lib';

export default defineComponent({
  props: {
    error: {
      type: String,
      default: '',
    },
  },
  data: () => ({
    color: colors.red.darken4,
  }),
});
</script>

<style scoped>

</style>
