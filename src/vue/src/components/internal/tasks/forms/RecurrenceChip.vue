<template>
  <v-menu :disabled="!selectable">
    <template #activator="{ on, attrs }">
      <v-chip
        color="primary"
        :outlined="!selectable"
        :class="classes"
        v-bind="{ ...props, ...attrs }"
        v-on="on"
      >
        {{ $t(value) }}
        <v-icon v-if="selectable" right>mdi-menu-down</v-icon>
      </v-chip>
    </template>

    <v-list class="text-center">
      <v-list-item-group :value="value" mandatory @change="$emit('input', $event)">
        <v-list-item v-for="recurrence in recurrences" :key="recurrence" :value="recurrence">
          {{ $t(recurrence) }}
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import type { tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import ezReeportMixin from '~/mixins/ezr';

export type Sizes = 'x-small' | 'small' | 'normal' | 'large' | 'x-large';

type CSSClasses = string | Record<string, boolean> | string[];

export default defineComponent({
  mixins: [ezReeportMixin],
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
    classes: {
      type: [String, Object, Array] as PropType<CSSClasses | undefined>,
      default: undefined,
    },
    on: {
      type: Object as PropType<Record<string, Function> | undefined>,
      default: undefined,
    },
  },
  computed: {
    recurrences(): tasks.Recurrence[] {
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
