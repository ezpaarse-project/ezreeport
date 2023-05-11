<template>
  <v-sheet
    rounded
    outlined
    class="my-2 pa-2"
  >
    <div class="text--secondary">
      {{ $t('headers.tags') }}:
    </div>

    <v-chip-group column>
      <v-chip
        v-for="tag in value"
        :key="tag.name"
        :color="tag.color"
        small
        class="mr-2"
        style="pointer-events: none;"
      >
        {{ tag.name }}
      </v-chip>
    </v-chip-group>
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';

export type Tag = templates.FullTemplate['tags'][number];

export default defineComponent({
  props: {
    value: {
      type: Array as PropType<Tag[]>,
      required: true,
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    tags: 'Tags'
  actions:
    add-tag: 'Add tag'
    new-tag: 'Create new tag'
fr:
  headers:
    tags: 'Étiquettes'
  actions:
    add-tag: 'Ajouter une étiquette'
    new-tag: 'Créer une étiquette'
</i18n>
