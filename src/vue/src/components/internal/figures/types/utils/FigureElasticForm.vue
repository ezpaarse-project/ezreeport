<template>
  <v-form ref="form">
    <!-- Fetch Count -->
    <CustomSection
      :label="$t('headers.fetchCount').toString()"
      collapsable
    >
      <template #collapse>
        <v-switch
          :input-value="fetchOptions.isFetchCount"
          :readonly="readonly"
          dense
          hide-details
          class="mt-0"
          @change="onFetchOptionUpdate({
            fetchCount: ($event ? 'total_count' : undefined),
          })"
          @click.prevent=""
        />
      </template>

      <v-text-field
        v-if="fetchOptions.isFetchCount"
        :value="fetchOptions.fetchCount"
        :label="$t('$ezreeport.fetchOptions.aggName').toString()"
        :readonly="readonly"
        hide-details="auto"
        class="ml-2"
        @input="onFetchOptionUpdate({ fetchCount: $event })"
      >
        <template #append-outer v-if="fetchOptions.fetchCount">
          <!-- Type def -->
          <v-menu
            v-model="showDefinition"
            offset-y
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
                {{ $t('headers.typeHelper') }}
              </v-card-title>

              <TSPreview :value="countDefinition.type" />
            </v-card>
          </v-menu>
        </template>
      </v-text-field>
    </CustomSection>

    <!--  Filters -->
    <CustomSection
      v-if="!readonly || fetchOptions.filtersCount > 0"
      :label="$t('$ezreeport.fetchOptions.filters').toString()"
      :collapse-disabled="fetchOptions.filtersCount <= 0"
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
        :value="fetchOptions.filters"
        :readonly="readonly"
        @input="onFetchOptionUpdate({ filters: $event })"
      />
    </CustomSection>

    <!-- Aggregations -->
    <CustomSection
      v-if="!readonly || fetchOptions.aggs.length > 0"
      :label="$t('$ezreeport.fetchOptions.aggregations').toString()"
      :collapse-disabled="fetchOptions.aggs.length <= 0"
      collapsable
    >
      <template #actions v-if="!readonly">
        <v-btn
          icon
          x-small
          color="success"
          @click="onAggCreated"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>

      <ElasticAggsBuilder
        ref="aggBuilder"
        :value="fetchOptions.aggs"
        :readonly="readonly"
        @input="onFetchOptionUpdate({ aggs: $event })"
      />
    </CustomSection>

    <!-- Advanced -->
    <CustomSection v-if="!readonly || fetchOptions.othersCount > 0">
      <ToggleableObjectTree
        :label="$t('$ezreeport.advanced_parameters').toString()"
        :value="fetchOptions.others || {}"
        v-on="fetchOptions.otherListeners"
      />
    </CustomSection>
  </v-form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { pick } from 'lodash';
import useTemplateStore, { transformFetchOptions, type FetchOptions, supportedFetchOptions } from '~/stores/template';
import { aggsDefinition } from '~/lib/elastic/aggs';
import type ElasticAggsBuilderConstructor from '~/components/internal/utils/elastic/aggs/ElasticAggsBuilder.vue';
import type ElasticFilterBuilderConstructor from '~/components/internal/utils/elastic/filters/ElasticFilterBuilder.vue';

type ElasticAggsBuilder = InstanceType<typeof ElasticAggsBuilderConstructor>;
type ElasticFilterBuilder = InstanceType<typeof ElasticFilterBuilderConstructor>;

export default defineComponent({
  props: {
    layoutId: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    showDefinition: false,
  }),
  computed: {
    layout() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );
      return layout;
    },
    /**
     * Fetch options of the layout
     */
    fetchOptions(): FetchOptions & { otherListeners?: Record<string, (e: any) => void> } {
      const opts = transformFetchOptions(this.layout?.fetchOptions);

      if (this.readonly) {
        return opts;
      }

      return {
        ...opts,
        otherListeners: { input: (e: object) => this.onFetchOptionUpdate({ ...e }) },
      };
    },
    countDefinition() {
      return aggsDefinition.sum;
    },
  },
  methods: {
    async onFetchOptionUpdate(data: Partial<FetchOptions>) {
      if (!this.layout) {
        return;
      }

      this.templateStore.UPDATE_LAYOUT(
        this.layout._.id,
        {
          ...this.layout,
          fetchOptions: {
            ...pick(this.layout.fetchOptions ?? {}, supportedFetchOptions),
            ...data,
          },
        },
      );

      // Revalidate
      if (data.fetchCount != null) {
        await this.$nextTick();
        (this.$refs.form as any)?.validate();
      }
    },
    onAggCreated() {
      const builder = this.$refs.aggBuilder as ElasticAggsBuilder | undefined;
      builder?.onElementCreated();
    },
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
