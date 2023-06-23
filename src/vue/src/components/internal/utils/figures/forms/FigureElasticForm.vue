<template>
  <v-form ref="form">
    <!-- Fetch Count -->
    <div class="mx-2">
      <span class="text--secondary">{{ $t('headers.fetchCount') }}</span>

      <div class="d-flex align-center">
        <v-checkbox
          :label="fetchOptions.isFetchCount ? '' : $t('no')"
          :input-value="fetchOptions.isFetchCount"
          :readonly="readonly"
          hide-details
          class="mt-0"
          @change="onFetchOptionUpdate({
            fetchCount: ($event ? '' : undefined),
          })"
        />

        <v-text-field
          v-if="fetchOptions.isFetchCount"
          :value="fetchOptions.fetchCount"
          :placeholder="$t('headers.fetchKey').toString()"
          :readonly="readonly"
          hide-details="auto"
          dense
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
      </div>
    </div>

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
      :label="$t('headers.fetchAggs').toString()"
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
        :label="$t('headers.advanced').toString()"
        :value="fetchOptions.others || {}"
        v-on="fetchOptions.otherListeners"
      />
    </CustomSection>
  </v-form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import useTemplateStore, { transformFetchOptions, type FetchOptions } from '~/stores/template';
import { aggsDefinition } from '~/lib/elastic/aggs';
import type ElasticAggsBuilderConstructor from '../../elastic/aggs/ElasticAggsBuilder.vue';
import type ElasticFilterBuilderConstructor from '../../elastic/filters/ElasticFilterBuilder.vue';

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
            ...(this.layout.fetchOptions ?? {}),
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
  no: 'No'
  headers:
    labels: 'Elements'
    advanced: 'Advanced parameters'
    fetchCount: 'Should fetch document count ?'
    typeHelper: 'Format of data'
    fetchKey: 'Aggregation name'
    fetchAggs: 'Aggregations'
  errors:
    empty: 'This field must be set'
fr:
  no: 'Non'
  headers:
    labels: 'Élements'
    advanced: 'Paramètres avancés'
    fetchCount: 'Récupérer le nombre de documents ?'
    typeHelper: 'Format des données'
    fetchKey: "Nom de l'aggregation"
    fetchAggs: 'Aggregations'
  errors:
    empty: 'Ce champ doit être rempli'
</i18n>
