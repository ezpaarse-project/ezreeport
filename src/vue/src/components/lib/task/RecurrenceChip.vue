<template>
  <v-chip
    v-bind="props"
    color="primary"
    :outlined="outlined"
  >
    {{ $t(value) }}
  </v-chip>
</template>

<script lang="ts">
import type { tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';

export type Sizes = 'x-small' | 'small' | 'normal' | 'large' | 'x-large';

export default defineComponent({
  props: {
    value: {
      type: String as PropType<tasks.Recurrence>,
      required: true,
    },
    size: {
      type: String as PropType<Sizes>,
      default: 'normal',
    },
    outlined: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    props() {
      return {
        [this.size]: true,
      };
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
messages:
  en:
    DAILY: Daily
    WEEKLY: Weekly
    MONTHLY: Monthly
    QUARTERLY: Quarterly
    BIENNIAL: Biennial
    YEARLY: Yearly
  fr:
    DAILY: Quotidien
    WEEKLY: Hebdomadaire
    MONTHLY: Mensuel
    QUARTERLY: Trimestriel
    BIENNIAL: Bi-annuel
    YEARLY: Annuel
</i18n>
