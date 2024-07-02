<template>
  <v-fade-transition>
    <div>
      <v-overlay
        v-if="props.value"
        color="background"
        absolute
        class="text-center"
        opacity="0.8"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </v-overlay>
    </div>
  </v-fade-transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  value?: boolean,
}>();
</script>
