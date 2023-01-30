<template>
  <v-sheet rounded outlined class="pa-2 mt-2">
    {{ $t('headers.figure', { id }) }}
    <v-select
      :label="$t('headers.type')"
      :value="figure.type"
      :items="figureTypes"
      item-text="label"
      item-value="value"
      readonly />

    <v-textarea v-if="figure.data && figure.type === 'md'" :value="figure.data" readonly :label="$t('headers.data')" />

    <ToggleableObjectTree
      v-else-if="Array.isArray(figure.data)"
      :label="$t('headers.data').toString()"
      :value="figure.data"
      class="mb-2" />

    <ToggleableObjectTree
      v-if="figure.params"
      :label="$t('headers.figureParams').toString()"
      :value="figure.params"
      class="mb-2" />

    <v-select
      :label="$t('headers.slots')"
      :value="figure.slots || []"
      :items="availableSlots"
      multiple
      readonly
    />
  </v-sheet>
</template>

<script lang="ts">
import type { templates } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    figure: {
      type: Object as PropType<templates.Figure>,
      required: true,
    },
    id: {
      type: [Number, String],
      required: true,
    },
  },
  data: () => ({
    availableSlots: [1, 2, 3, 4], // TODO: rules
  }),
  computed: {
    figureTypes() {
      return [
        { label: this.$t('types.table'), value: 'table' },
        { label: this.$t('types.md'), value: 'md' },
        { label: this.$t('types.metric'), value: 'metric' },
      ];
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    figure: 'Figure #{id}'
    type: 'Figure type'
    data: 'Figure data'
    figureParams: 'Figure params'
    slots: 'Figure slot(s)'
  types:
    table: 'Table'
    md: 'Markdown'
    metric: 'Metrics'
fr:
  headers:
    figure: 'Visualisation #{id}'
    type: 'Type de visualisation'
    data: 'Données de la visualisation'
    figureParams: 'Paramètres de la visualisation'
    slots: 'Emplacements de la visualisation'
  types:
    table: 'Table'
    md: 'Markdown'
    metric: 'Métriques'
</i18n>
