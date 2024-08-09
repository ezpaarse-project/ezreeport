<template>
  <v-menu v-model="shown" :close-on-content-click="false" max-width="450" min-width="450">
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        x-small
        color="primary"
        v-bind="attrs"
        @click="filterImport = ''"
        v-on="on"
      >
        <v-icon>mdi-import</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-title>
        {{ $t('title') }}
      </v-card-title>

      <v-card-subtitle>
        {{ $t('description') }}
      </v-card-subtitle>

      <v-card-text>
        <v-textarea v-model="filterImport" outlined hide-details />

        {{ $tc('nbFilters', filters.length) }}
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          :disabled="filters.length <= 0"
          color="primary"
          @click="importFilter()"
        >
          {{ $t('import') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

type FilterItem = {
  invert: boolean;
  field: string;
  filter: Record<string, any>;
};

const emit = defineEmits<{
  (e: 'import', filters: Record<string, any>): void
}>();

const shown = ref(false);
const filterImport = ref('');

const isFilterItem = (obj: FilterItem | undefined): obj is FilterItem => !!obj;

const filters = computed(
  () => filterImport.value
    .split('\n')
    .map(
      (line): FilterItem | undefined => {
        const matches = /^(?:(?<invert>NOT)\s)?(?<field>.+): (?<value>.*)/.exec(line);
        const { invert, field, value } = matches?.groups ?? {};
        if (!field || !value) {
          return undefined;
        }

        let filter: Record<string, any> = { match_phrase: { [field]: value } };
        if (value === 'exists') {
          filter = { exists: { field } };
        }

        return {
          invert: !!invert,
          field,
          filter,
        };
      },
    )
    .filter(isFilterItem),
);

const importFilter = () => {
  if (filters.value.length <= 0) {
    return;
  }

  const map = new Map<boolean, Map<string, Record<string, any>[]>>();
  // eslint-disable-next-line no-restricted-syntax
  for (const { field, invert, filter } of filters.value) {
    const a = map.get(invert) ?? new Map();
    const b = a.get(field) ?? [];

    b.push(filter);

    a.set(field, b);
    map.set(invert, a);
  }

  const result = {
    filters: [] as Record<string, any>[],
    must_not: [] as Record<string, any>[],
  };
  // eslint-disable-next-line no-restricted-syntax
  for (const [invert, fieldFilters] of map) {
    // eslint-disable-next-line no-restricted-syntax
    for (const fs of fieldFilters.values()) {
      let value: Record<string, any> = fs[0];
      if (fs.length > 1) {
        value = {
          bool: {
            should: fs,
          },
        };
      }
      result[invert ? 'must_not' : 'filters'].push(value);
    }
  }

  emit('import', result);
  shown.value = false;
};
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  title: Import filters
  description: Copy filters from Kibana and past them in the following area.
  nbFilters: '{n} filters found'
  import: 'Import'
fr:
  title: Importer des filtres
  description: Copiez les filtres depuis Kibana et collez-les dans la zone suivante.
  nbFilters: '{n} filtres trouvés'
  import: 'Importer'
</i18n>
