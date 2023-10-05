<template>
  <v-navigation-drawer
    :value="show"
    right
    absolute
    temporary
    width="512"
    @input="$emit('update:show', $event)"
  >
    <v-toolbar flat>
      <v-toolbar-title>
        {{ $t('$ezreeport.filter') }}
      </v-toolbar-title>

      <v-spacer />

      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn icon @click="clearFilters" v-bind="attrs" v-on="on">
            <v-icon>mdi-filter-off</v-icon>
          </v-btn>
        </template>

        {{ $t('$ezreeport.reset') }}
      </v-tooltip>

      <v-btn icon @click="$emit('update:show', false)">
        <v-icon>
          mdi-close
        </v-icon>
      </v-btn>
    </v-toolbar>

    <v-container>
      <v-row>
        <v-col>
          <v-text-field
            :value="value.name"
            :label="$t('headers.name')"
            prepend-icon="mdi-alphabetical"
            hide-details
            @input="onFilterUpdate('name', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-autocomplete
            :value="value.tags"
            :items="tagsItems"
            :label="$t('headers.tags')"
            prepend-icon="mdi-tag"
            multiple
            hide-details
            @change="onFilterUpdate('tags', $event)"
          >
            <template #selection="{ item }">
              <ReadableChip
                v-if="item.value"
                :color="item.tag.color"
                small
                class="mr-2"
                style="pointer-events: none;"
              >
                {{ item.tag.name }}
              </ReadableChip>
              <template v-else>
                {{ item.text }}
              </template>
            </template>

            <template #item="{ item }">
              <ReadableChip
                v-if="item.value"
                :color="item.tag.color"
                :disabled="item.disabled"
                small
                class="mr-2"
                style="pointer-events: none;"
              >
                {{ item.tag.name }}
              </ReadableChip>
              <template v-else>
                {{ item.text }}
              </template>
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>
    </v-container>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';

type Filters = Partial<{
  name: string,
  tags: string[]
}>;

export default defineComponent({
  props: {
    value: {
      type: Object as PropType<Filters>,
      required: true,
    },
    show: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: Array as PropType<templates.FullTemplate['tags']>,
      default: () => [],
    },
  },
  emits: {
    input: (val: Filters) => !!val,
    'update:show': (show: boolean) => show !== undefined,
  },
  computed: {
    tagsItems() {
      const isDisabled = this.value.tags?.includes('');
      const tags = this.tags.map(
        (t) => ({
          tag: t,
          text: t.name,
          value: t.name,
          disabled: isDisabled,
        }),
      );

      return [
        // '' actually means: no tags
        {
          value: '',
          text: this.$t('no_data.tags'),
          disabled: !isDisabled && (this.value.tags?.length ?? 0) > 0,
        },
        ...tags,
      ];
    },
  },
  methods: {
    onFilterUpdate<K extends keyof Filters>(field: K, data: Filters[K]) {
      const filters = { ...this.value };
      filters[field] = data;
      this.$emit('input', filters);
    },
    clearFilters() {
      this.$emit('input', {});
      this.$emit('update:show', false);
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  no_data:
    tags: 'No tags'
  headers:
    name: 'Name'
    tags: 'Tags'
fr:
  no_data:
    tags: 'Aucune étiquette'
  headers:
    name: 'Nom'
    tags: 'Étiquettes'
</i18n>
