<template>
  <v-avatar
    :text="props.modelValue"
    :image="src"
    density="compact"
    variant="outlined"
    :class="{
      'text-uppercase': true,
      'locale-flag': true,
      'locale-flag--cover': shouldCover,
    }"
  />
</template>

<script setup lang="ts">
  import enFlag from '~/assets/locales/en.svg';
  import frFlag from '~/assets/locales/fr.svg';

  const props = defineProps<{
    modelValue: string;
  }>();

  const src = computed(() => {
    switch (props.modelValue) {
      case 'fr':
        return frFlag;
      case 'en':
        return enFlag;

      default:
        return;
    }
  });

  const shouldCover = computed(
    () => src.value && ['en'].includes(props.modelValue)
  );
</script>

<style lang="css" scoped>
  .locale-flag :deep(.v-img__img) {
    object-fit: initial;
  }
  .locale-flag--cover :deep(.v-img__img) {
    object-fit: cover;
  }
</style>
