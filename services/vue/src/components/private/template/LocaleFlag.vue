<template>
  <v-avatar
    :text="props.modelValue"
    :image="src?.default"
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
  const props = defineProps<{
    modelValue: string;
  }>();

  const src = computedAsync(
    () => import(`~/assets/locales/${props.modelValue}.svg`)
  );

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
