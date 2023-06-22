<template>
  <v-menu
    v-if="layout"
    :value="value"
    :position-x="coords.x"
    :position-y="coords.y"
    :close-on-content-click="false"
    absolute
    offset-y
    max-width="450"
    min-width="450"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title>
        {{ $t('title', { index: (layout.at ?? index) + 1 }) }}
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-form v-model="valid">
          <v-row>
            <v-col>
              <!-- Fetcher field -->
              <v-select
                :value="layout.fetcher"
                :label="$t('headers.fetcher')"
                :items="availableFetchers"
                :readonly="readonly"
                placeholder="elastic"
                persistent-placeholder
                @change="onParamUpdate({ fetcher: $event })"
              />

              <!--  Filters -->
              <CustomSection
                v-if="!readonly || fetchOptions.filtersCount > 0"
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

              <!-- Advanced -->
              <CustomSection v-if="!readonly || fetchOptions.othersCount > 0">
                <ToggleableObjectTree
                  :label="$t('headers.advancedOptions').toString()"
                  :value="fetchOptions.others || {}"
                  v-on="fetchOptions.otherListeners"
                />
              </CustomSection>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomLayout } from '~/lib/templates/customTemplates';
import { aggsDefinition } from '~/lib/elastic/aggs';
import useTemplateStore, { transformFetchOptions, type FetchOptions } from '~/stores/template';
import type ElasticFilterBuilderConstructor from '../../utils/elastic/filters/ElasticFilterBuilder.vue';

type ElasticFilterBuilder = InstanceType<typeof ElasticFilterBuilderConstructor>;

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    valid: false,

    availableFetchers: ['elastic'],
    showDefinition: false,
  }),
  computed: {
    index() {
      return this.templateStore.currentLayouts.findIndex(({ _: { id } }) => id === this.id);
    },
    layout: {
      get(): AnyCustomLayout | undefined {
        return this.templateStore.currentLayouts[this.index];
      },
      set(value: AnyCustomLayout) {
        this.templateStore.UPDATE_LAYOUT(this.id, value);
      },
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
    onParamUpdate(value: Partial<AnyCustomLayout>) {
      if (!this.layout) {
        return;
      }

      this.layout = {
        ...this.layout,
        ...value,
      };
    },
    onFetchOptionUpdate(value: Record<string, any>) {
      this.onParamUpdate({
        fetchOptions: {
          ...this.layout?.fetchOptions,
          ...value,
        },
      });
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
  errors:
    empty: 'Ce champ est requis'
    valid: 'La valeur doit être valide'
    negative: 'La valeur doit être positive'
    fetcher: 'Un outil de récupération OU des données doivent être présentes'
</i18n>
