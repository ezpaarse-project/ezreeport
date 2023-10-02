<template>
  <v-form ref="form">
    <!--  Filters -->
    <CustomSection
      v-if="!readonly || filtersCount > 0"
      :label="$t('$ezreeport.fetchOptions.filters').toString()"
      :collapse-disabled="filtersCount <= 0"
      collapsable
    >
      <template #actions v-if="!readonly">
        <v-btn
          icon
          x-small
          color="success"
          @click="onFilterCreated"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>

      <ElasticFilterBuilder
        ref="filterBuilder"
        :value="fetchOptions.filters ?? {}"
        :readonly="readonly"
        @input="$emit('update:fetchOptions', { filters: $event })"
      />
    </CustomSection>

    <!-- Aggregations -->
    <!-- deprecated, replaced by buckets, so only readonly for now -->
    <CustomSection
      v-if="'aggs' in fetchOptions && (fetchOptions.aggs?.length ?? 0) > 0"
      :label="$t('$ezreeport.fetchOptions.aggregations').toString()"
      collapsable
    >
      <ElasticAggsBuilder
        ref="aggBuilder"
        :value="fetchOptions.aggs ?? []"
        readonly
      />
    </CustomSection>

    <!-- Fetch Count -->
    <v-checkbox
      v-if="!hideFetchCount"
      :input-value="fetchOptions.fetchCount"
      :label="$t('headers.fetchCount').toString()"
      :readonly="readonly"
      dense
      hide-details
      class="my-3"
      @change="$emit('update:fetchOptions', {
        fetchCount: ($event ? 'total_count' : undefined),
      })"
      @click.prevent=""
    />
  </v-form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import useTemplateStore, { type FetchOptions } from '~/stores/template';

import type ElasticFilterBuilderConstructor from '~/components/internal/utils/elastic/filters/ElasticFilterBuilder.vue';

type ElasticFilterBuilder = InstanceType<typeof ElasticFilterBuilderConstructor>;

export default defineComponent({
  props: {
    layoutId: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    hideFetchCount: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    'update:fetchOptions': (data: Partial<FetchOptions>) => !!data,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    showDefinition: false,
  }),
  computed: {
    /**
     * Fetch options of the figure
     */
    fetchOptions() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );
      return layout?.figures.find(({ _: { id } }) => id === this.id)?.fetchOptions ?? {};
    },
    /**
     * Count of filters
     */
    filtersCount() {
      return Object.values(this.fetchOptions.filters ?? {})
        .filter((v) => Array.isArray(v))
        .length;
    },
  },
  methods: {
    onFilterCreated() {
      const builder = this.$refs.filterBuilder as ElasticFilterBuilder | undefined;
      builder?.onElementCreated();
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    labels: 'Elements'
    fetchCount: 'Should fetch document count ?'
    typeHelper: 'Format of data'
fr:
  headers:
    labels: 'Élements'
    fetchCount: 'Récupérer le nombre de documents ?'
    typeHelper: 'Format des données'
</i18n>
