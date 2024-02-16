<template>
  <v-fade-transition>
    <v-overlay
      v-if="props.value"
      color="error"
      absolute
      class="text-center"
      opacity="0.8"
    >
      <div>{{ value }}</div>

      <v-btn v-if="!hideAction" @click="emit('input', '')">
        {{ $t('close') }}
      </v-btn>
    </v-overlay>
  </v-fade-transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: string
  hideAction?: boolean,
}>();

const emit = defineEmits<{
  (e: 'input', val: string): void
}>();
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  close: 'Close'
fr:
  close: 'Fermer'
</i18n>
