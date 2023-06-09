<template>
  <v-dialog
    :value="value"
    width="1000"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title>
        {{ $t('title', { index }) }}
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-form v-model="valid">
          <v-row>
            <v-col>
              <!-- At field -->
              <v-text-field
                :value="layout.at ?? index"
                :label="$t('headers.position')"
                :readonly="readonly"
                :rules="rules.position"
                type="number"
                min="0"
                hide-details="auto"
                @input="onPositionChange"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col style="position: relative;">
              <v-overlay :value="isStaticData" absolute />

              <!-- Fetcher field -->
              <v-select
                :value="layout.fetcher"
                :label="$t('headers.fetcher')"
                :items="availableFetchers"
                :rules="rules.fetcher"
                :readonly="readonly"
                placeholder="elastic"
                persistent-placeholder
                @change="$emit('update:layout', { ...layout, fetcher: $event })"
              />

              <!-- Fetch Count -->
              <div class="mx-2">
                <span class="text--secondary">{{ $t('headers.fetchCount') }}</span>

                <div class="d-flex align-center mb-4">
                  <v-checkbox
                    :input-value="fetchOptions.isFetchCount"
                    :readonly="readonly"
                    hide-details
                    class="mt-0"
                    @change="onFetchOptionUpdate({
                      fetchCount: (fetchOptions.isFetchCount ? undefined : ''),
                    })"
                  />

                  <v-text-field
                    :value="fetchOptions.fetchCount"
                    :placeholder="$t('headers.fetchKey').toString()"
                    :disabled="!fetchOptions.isFetchCount"
                    :readonly="readonly"
                    dense
                    hide-details
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
                :label="$t('headers.fetchFilters').toString()"
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
              <CustomSection>
                <ToggleableObjectTree
                  v-if="readonly"
                  :label="$t('headers.advancedOptions').toString()"
                  :value="fetchOptions.others || {}"
                />
                <ToggleableObjectTree
                  v-else
                  :label="$t('headers.advancedOptions').toString()"
                  :value="fetchOptions.others || {}"
                  @input="
                    !Array.isArray($event)
                      && onFetchOptionUpdate({ ...$event })
                  "
                />
              </CustomSection>
            </v-col>

            <!-- TODO: choose type of data str/object -->
            <v-divider vertical />

            <v-col style="position: relative;">
              <v-overlay :value="!isStaticData" absolute />
              <v-textarea
                :value="layout.data || ''"
                :label="$t('headers.data')"
                :rules="rules.data"
                :readonly="readonly"
                @blur="onMdChange"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('actions.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { omit } from 'lodash';
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomLayout } from '~/lib/templates/customTemplates';
import { aggsDefinition } from '~/lib/elastic/aggs';
import type ElasticFilterBuilderConstructor from '../../utils/elastic/filters/ElasticFilterBuilder.vue';
import type ElasticAggsBuilderConstructor from '../../utils/elastic/aggs/ElasticAggsBuilder.vue';

type ElasticFilterBuilder = InstanceType<typeof ElasticFilterBuilderConstructor>;
type ElasticAggsBuilder = InstanceType<typeof ElasticAggsBuilderConstructor>;

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    layout: {
      type: Object as PropType<AnyCustomLayout>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    'update:layout': (value: AnyCustomLayout) => !!value,
    'update:index': (value: number) => value >= 0,
  },
  data: () => ({
    valid: false,

    availableFetchers: ['elastic'],
    isStaticData: false,
    showDefinition: false,
  }),
  computed: {
    rules() {
      return {
        position: [
          (v: string) => v !== '' || this.$t('errors.empty'),
          (v: string) => !Number.isNaN(v) || this.$t('errors.valid'),
          (v: string) => +v >= 0 || this.$t('errors.negative'),
        ],
        fetcher: [
          // (v: string) => !!v || !!this.layout.data || this.$t('errors.fetcher'),
        ],
        data: [
          (v: string) => !!v || !!this.layout.fetcher || this.$t('errors.fetcher'),
        ],
      };
    },
    /**
     * Fetch options of the layout
     */
    fetchOptions() {
      const opts = {
        isFetchCount: false,
        fetchCount: undefined as string | undefined,
        filters: {} as Record<string, any>,
        filtersCount: 0,
        others: {} as Record<string, any>,
        aggs: [] as any[],
      };

      if (!this.layout.fetchOptions) {
        return opts;
      }

      // Extract filters with compatible type definition
      if (
        'filters' in this.layout.fetchOptions
        && this.layout.fetchOptions.filters
        && typeof this.layout.fetchOptions.filters === 'object'
      ) {
        opts.filters = this.layout.fetchOptions.filters;
        opts.filtersCount = Object.values(opts.filters).reduce(
          (prev, value) => {
            let count = 0;
            if (Array.isArray(value)) {
              count = value.length;
            }
            return prev + count;
          },
          0,
        );
      }

      // Extract fetch count with compatible type definition
      if (
        'fetchCount' in this.layout.fetchOptions
        && this.layout.fetchOptions.fetchCount != null
        && typeof this.layout.fetchOptions.fetchCount === 'string'
      ) {
        opts.fetchCount = this.layout.fetchOptions.fetchCount;
        opts.isFetchCount = typeof opts.fetchCount === 'string';
      }

      // Extract aggs with compatible type definition
      if (
        'aggs' in this.layout.fetchOptions
        && this.layout.fetchOptions.aggs != null
        && Array.isArray(this.layout.fetchOptions.aggs)
      ) {
        opts.aggs = this.layout.fetchOptions.aggs;
      }
      if (
        'aggregations' in this.layout.fetchOptions
        && this.layout.fetchOptions.aggregations != null
        && Array.isArray(this.layout.fetchOptions.aggregations)
      ) {
        opts.aggs = this.layout.fetchOptions.aggregations;
      }

      opts.others = omit(this.layout.fetchOptions, ['filters', 'fetchCount', 'aggs', 'aggregations']);
      return opts;
    },
    countDefinition() {
      return aggsDefinition.sum;
    },
  },
  methods: {
    onPositionChange(value: string) {
      if (this.rules.position.every((rule) => rule(value) === true)) {
        this.$emit('update:index', +value);
      }
    },
    onMdChange(e: Event) {
      const { value } = e.target as HTMLInputElement;
      if (value !== this.layout.data) {
        this.$emit('update:layout', { ...this.layout, data: value });
      }
    },
    onFetchOptionUpdate(value: Record<string, any>) {
      this.$emit(
        'update:layout',
        {
          ...this.layout,
          fetchOptions: {
            ...this.layout.fetchOptions,
            ...value,
          },
        },
      );
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
  title: 'Settings for page #{index}'
  headers:
    position: 'Page number'
    fetcher: 'Fetcher'
    fetchOptions: 'Fetch options'
    fetchFilters: 'Filters'
    fetchCount: 'Should fetch document count ?'
    typeHelper: 'Format of data'
    fetchKey: 'Key to use in figures'
    fetchAggs: 'Aggregations'
    advancedOptions: 'Advanced options'
    data: 'Figures data'
  actions:
    close: 'Close'
  errors:
    empty: 'This field is required'
    valid: 'The value must be valid'
    negative: 'The value must be positive'
    fetcher: 'A fetcher OR data must be present'
fr:
  title: 'Paramètres de la page #{index}'
  headers:
    position: 'Numéro de page'
    fetcher: 'Outil de récupération'
    fetchOptions: 'Options de récupération'
    fetchFilters: 'Filtres'
    fetchCount: 'Récupérer le nombre de documents ?'
    typeHelper: 'Format des données'
    fetchKey: 'Clé à utiliser dans les visus'
    fetchAggs: 'Aggregations'
    advancedOptions: 'Options avancées'
    data: 'Données des visualisations'
  actions:
    close: 'Fermer'
  errors:
    empty: 'Ce champ est requis'
    valid: 'La valeur doit être valide'
    negative: 'La valeur doit être positive'
    fetcher: 'Un outil de récupération OU des données doivent être présentes'
</i18n>
