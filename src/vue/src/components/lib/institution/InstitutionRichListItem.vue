<template>
  <RichListItem
    :title="institution.name"
    :subtitle="institution.city"
    :src="`/api/assets/logos/${institution.logoId}`"
    :alt="`Logo de ${institution.name}`"
    fallback-icon="mdi-office-building"
    capitalize-subtitle
  />
</template>

<script lang="ts">
import type { institutions } from 'ezreeport-sdk-js';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    institution: {
      type: Object as PropType<institutions.Institution>,
      required: true,
    },
  },
});
</script>

<style scoped>

</style>
