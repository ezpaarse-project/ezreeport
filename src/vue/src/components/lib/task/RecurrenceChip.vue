<template>
  <v-menu :disabled="!selectable">
    <template #activator="{ on, attrs }">
      <v-chip
        color="primary"
        :outlined="!selectable"
        v-bind="{ ...props, ...attrs }"
        v-on="on"
      >
        {{ $t(value) }}
      </v-chip>
    </template>

    <v-list class="text-center">
      <v-list-item-group :value="value" mandatory @change="$emit('input', $event)">
        <v-list-item v-for="reccurence in reccurences" :key="reccurence" :value="reccurence">
          {{ $t(reccurence) }}
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-menu>
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
    selectable: {
      type: Boolean,
      default: false,
    },
    on: {
      type: Object,
      default: undefined,
    },
  },
  computed: {
    reccurences(): tasks.Recurrence[] {
      return Object.values(this.$ezReeport.sdk.tasks.Recurrence);
    },
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
en:
  DAILY: 'Daily'
  WEEKLY: 'Weekly'
  MONTHLY: 'Monthly'
  QUARTERLY: 'Quarterly'
  BIENNIAL: 'Biennial'
  YEARLY: 'Yearly'
fr:
  DAILY: 'Quotidien'
  WEEKLY: 'Hebdomadaire'
  MONTHLY: 'Mensuel'
  QUARTERLY: 'Trimestriel'
  BIENNIAL: 'Bi-annuel'
  YEARLY: 'Annuel'
</i18n>
