<template>
  <RichListItem
    :title="namespace.name"
    :src="src"
    :alt="`Logo de ${namespace.name}`"
    fallback-icon="mdi-office-building"
    capitalize-subtitle
  />
</template>

<script lang="ts">
import type { namespaces } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent, PropType } from 'vue';
import ezReeportMixin from '~/mixins/ezr';

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    namespace: {
      type: Object as PropType<namespaces.Namespace>,
      required: true,
    },
  },
  data: () => ({
  }),
  computed: {
    src(): string | undefined {
      if (!this.namespace.logoId) {
        return undefined;
      }
      return new URL(this.namespace.logoId, this.$ezReeport.data.namespaces.logoUrl).href;
    },
  },
});
</script>

<style scoped>

</style>
