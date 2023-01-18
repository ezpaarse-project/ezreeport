<template>
  <v-fade-transition>
    <v-overlay
      v-if="value"
      :color="color"
      absolute
      class="text-center"
      opacity="0.8"
    >
      <div>{{ value }}</div>
      <v-btn @click="$emit('input', '')">
        {{ $t('close') }}
      </v-btn>
    </v-overlay>
  </v-fade-transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  emits: {
    input(val: string) {
      return val.length >= 0;
    },
  },
  data: (vm) => ({
    color: vm.$vuetify.theme.currentTheme.error,
  }),
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  close: 'Close'
fr:
  close: 'Fermer'
</i18n>
