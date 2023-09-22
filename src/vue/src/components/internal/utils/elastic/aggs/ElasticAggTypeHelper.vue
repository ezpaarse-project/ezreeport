<template>
  <v-menu
    v-if="typeDefinition"
    :value="value"
    offset-y
    @input="$emit('input', $event)"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        small
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>mdi-information</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="py-1">
        {{ $t('typeHelper') }}
      </v-card-title>

      <TSPreview :value="typeDefinition.type" :is-array="typeDefinition.isArray" />
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { getTypeDefinitionFromAgg } from '~/lib/elastic/aggs';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    agg: {
      type: Object as PropType<Record<string, any> | undefined>,
      default: undefined,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
  },
  computed: {
    typeDefinition() {
      return getTypeDefinitionFromAgg(this.agg);
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  typeHelper: 'Format of data'
fr:
  typeHelper: 'Format des données'
</i18n>
