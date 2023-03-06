<template>
  <RichListItem
    :title="institution.name"
    :subtitle="institution.city"
    :src="src"
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
  data: () => ({
  }),
  computed: {
    src(): string | undefined {
      if (!this.institution.logoId) {
        return undefined;
      }
      return new URL(this.institution.logoId, this.$ezReeport.institutions.logoUrl).href;
    },
  },
});
</script>

<style scoped>

</style>
