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
import { defineComponent, PropType } from 'vue';

export interface InstitutionItem {
  id: string,
  name: string,
  city?: string,
  logoId?: string,
  acronym?: string,
}

export default defineComponent({
  props: {
    institution: {
      type: Object as PropType<InstitutionItem>,
      required: true,
    },
  },
});
</script>

<style scoped>

</style>
