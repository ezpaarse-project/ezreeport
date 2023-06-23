<template>
  <v-dialog
    :value="value"
    width="600"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title>
        <!-- Name -->
        <v-text-field
          v-model="innerName"
          :label="$t('$ezreeport.fetchOptions.aggName')"
          :rules="rules.name"
          :readonly="readonly"
          hide-details="auto"
          @blur="onElementUpdate({ name: innerName })"
          class="mr-2"
        />

        <!-- Advanced edition switch -->
        <v-tooltip top>
          <template #activator="{ attrs, on }">
            <v-btn
              :disabled="isTooAdvanced"
              icon
              @click="showAdvanced = !showAdvanced"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-{{ showAdvanced ? 'list-box-outline' : 'code-json' }}</v-icon>
            </v-btn>
          </template>

          <span>{{ $t(`headers.${showAdvanced ? 'simple' : 'advanced'}Edition`) }}</span>
        </v-tooltip>

        <!-- Close -->
        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Simple edition -->
        <v-row v-if="!showAdvanced">
          <v-col>
            <!-- Type -->
            <v-select
              :value="type.value"
              :items="availableTypes"
              :label="$t('headers.type')"
              :readonly="readonly"
              hide-details
              @change="onTypeUpdate"
            >
              <template #append-outer v-if="typeDefinition">
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

                    <TSPreview :value="typeDefinition.type" :is-array="typeDefinition.isArray" />
                  </v-card>
                </v-menu>
              </template>
            </v-select>

            <v-divider class="my-4" />

            <!-- Field -->
            <v-text-field
              :value="type.data?.field"
              :label="$t('headers.field')"
              :readonly="readonly"
              @input="onTypeFieldUpdate({ field: $event })"
            />

            <!-- Size -->
            <v-text-field
              :value="type.data?.size"
              :label="$t('headers.count')"
              :min="0"
              :readonly="readonly"
              type="number"
              @input="onSizeUpdate"
            />

            <!-- Sort -->
            <div class="d-flex align-center">
              <v-combobox
                :value="order.value"
                :items="availableSorts"
                :label="$t('headers.sort')"
                :return-object="false"
                :readonly="readonly"
                class="mr-4"
                @input="onOrderUpdate"
              />

              <!-- Sort order -->
              <v-tooltip top>
                <template #activator="{ attrs, on }">
                  <v-btn
                    icon
                    @click="onOrderDataUpdate(order.data === 'asc' ? 'desc' : 'asc')"
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon>mdi-{{ order.data === 'asc' ? 'sort-ascending' : 'sort-descending' }}</v-icon>
                  </v-btn>
                </template>

                <span>{{ $t('headers.sortOrder', { order: $t(`sortOrder.${order.data || 'desc'}`) }) }}</span>
              </v-tooltip>
            </div>

            <!-- Sub aggregations -->
            <CustomSection
              v-if="!typeDefinition || typeDefinition.canHaveSub"
              :label="$t('headers.subAggs').toString()"
              :collapse-disabled="(element.aggs || element.aggregations || []).length <= 0"
              collapsable
            >
              <template #actions>
                <v-btn
                  v-if="!readonly"
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
                :value="element.aggs || element.aggregations || []"
                :readonly="readonly"
                @input="onElementUpdate({ [element.aggregations ? 'aggregations' : 'aggs']: $event })"
              />
            </CustomSection>
          </v-col>
        </v-row>

        <!-- Advanced edition -->
        <v-row v-if="showAdvanced">
          <v-col>
            <v-textarea
              :value="formattedJSON.data"
              :label="$t('headers.advancedEdition')"
              :rows="formattedJSON.rows"
              :rules="rules.advanced"
              :readonly="readonly"
              outlined
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  aggsTypes,
  sortOptions,
  sizeKeyByType,
  aggsDefinition,
  type AggDefinition,
} from '~/lib/elastic/aggs';
import type ElasticAggsBuilderConstructor from './ElasticAggsBuilder.vue';

type ElasticAggsBuilder = InstanceType<typeof ElasticAggsBuilderConstructor>;

const aggsSet = new Set<string>(aggsTypes);
/**
 * Root keys handled by the simple edition
 */
const handledKeys = new Set(['name', 'aggs', 'aggregations']);

export default defineComponent({
  props: {
    /**
     * Is the dialog shown
     */
    value: {
      type: Boolean,
      required: true,
    },
    /**
     * The current aggregation
     */
    element: {
      type: Object as PropType<Record<string, any>>,
      required: true,
    },
    /**
     * The index of the current aggregation
     */
    elementIndex: {
      type: Number,
      required: true,
    },
    /**
     * Should be readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    /**
     * Triggered when dialog visibility changes
     *
     * @param show The new visibility
     */
    input: (show: boolean) => show !== undefined,
    /**
     * Triggered when current aggregation is updated
     *
     * @param index The index of the current aggregation
     * @param el The new state of the aggregation
     */
    'update:element': (index: number, el: Record<string, any>) => index >= 0 && !!el,
  },
  data: () => ({
    innerName: '',
    showAdvanced: false,
    showDefinition: false,
  }),
  watch: {
    value() {
      if (this.value) {
        this.innerName = this.element.name || `agg${this.elementIndex}`;
        this.showAdvanced = this.isTooAdvanced;
      }
    },
  },
  computed: {
    /**
     * Root keys in aggregations that are not handled by the simple mode
     */
    unknownKeys(): string[] {
      return Object.keys(this.element).filter((k) => !handledKeys.has(k));
    },
    /**
     * Is the aggregation too advanced to be handled in the simple mode
     */
    isTooAdvanced(): boolean {
      return this.unknownKeys.length > 1
        || (!!this.type.value && !aggsSet.has(this.type.value));
    },
    /**
     * The current type of aggregation
     */
    type() {
      // Since there's should be only one unknown key, is the type of aggregation
      const value = this.unknownKeys[0];
      return {
        value,
        data: this.element[value],
      };
    },
    /**
     * The current size parameter of aggregation
     */
    size(): number | undefined {
      const field = sizeKeyByType[this.type.value] || 'size';
      return this.type.data?.[field];
    },
    /**
     * The current order parameter of aggregation
     */
    order() {
      const obj = this.type.data?.order ?? {};
      const value = Object.keys(obj)[0] ?? '';
      return {
        value,
        data: obj[value],
      };
    },
    /**
     * Validation rules for fields
     */
    rules() {
      return {
        name: [
          (v: string) => v?.length > 0 || this.$t('errors.required'),
        ],
        advanced: [
          (v: string) => {
            if (!this.showAdvanced) {
              return true;
            }

            try {
              JSON.parse(v);
              return true;
            } catch (error) {
              return this.$t('errors.not_valid_json');
            }
          },
        ],
      };
    },
    /**
     * Formatted JSON to show in a text-area
     */
    formattedJSON() {
      const data = JSON.stringify(this.element, undefined, 4);
      return {
        data,
        rows: Math.min(data.split('\n').length, 20),
      };
    },
    /**
     * Possible types of aggregations with localization
     */
    availableTypes() {
      return aggsTypes.map((value) => ({
        text: this.$t(`types.${value}`),
        value,
      }));
    },
    /**
     * Possible sorts with localization
     */
    availableSorts() {
      return sortOptions.map((value) => ({
        text: this.$t(`sorts.${value}`),
        value,
      }));
    },
    typeDefinition(): AggDefinition | undefined {
      const def = (aggsDefinition as Record<string, AggDefinition>)[this.type.value];
      if (def?.type) {
        // Add aggregations as unknown
        const aggs = this.element.aggs ?? this.element.aggregations;
        const aggsDef = Object.values(aggs ?? {}).reduce(
          (prev: Record<string, ObjectConstructor>, k: any, i: number) => ({
            ...prev,
            [k.name || `agg${i}`]: Object,
          }),
          {},
        );

        return {
          ...def,
          type: {
            ...def.type,
            ...aggsDef,
          },
        };
      }

      return def;
    },
  },
  methods: {
    /**
     * When the aggregation is updated
     *
     * @param data The new data
     */
    onElementUpdate(data: Record<string, any>) {
      if (this.readonly) {
        return;
      }

      this.$emit('update:element', this.elementIndex, { ...this.element, ...data });
    },
    /**
     * When type of aggregation is updated
     *
     * @param type The new type
     */
    onTypeUpdate(type: string) {
      if (this.readonly) {
        return;
      }

      const el = { ...this.element };
      delete el[this.type.value];
      // TODO: handle size change
      this.$emit(
        'update:element',
        this.elementIndex,
        { ...el, [type]: this.element[this.type.value] },
      );
    },
    /**
     * When field in type of aggregation is updated
     *
     * @param data The new data
     */
    onTypeFieldUpdate(data: Record<string, any>) {
      this.onElementUpdate({
        [this.type.value]: {
          ...this.type.data,
          ...data,
        },
      });
    },
    /**
     * When size parameter is updated
     *
     * @param size The new size
     */
    onSizeUpdate(size: string) {
      const field = sizeKeyByType[this.type.value] || 'size';

      const data: Record<string, number | undefined> = { [field]: +size };
      if (!size) {
        data[field] = undefined;
      }

      this.onTypeFieldUpdate(data);
    },
    /**
     * When order parameter is updated
     *
     * @param order The new order
     */
    onOrderUpdate(order: string) {
      this.onTypeFieldUpdate({
        order: {
          [order]: this.order.data ?? 'desc',
        },
      });
    },
    /**
     * When order data is updated
     *
     * @param data The new data
     */
    onOrderDataUpdate(data: any) {
      this.onTypeFieldUpdate({
        order: {
          [this.order.value]: data,
        },
      });
    },
    /**
     * When a new sub aggregation is created
     */
    onAggCreated() {
      const builder = this.$refs.aggBuilder as ElasticAggsBuilder | undefined;
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
    simpleEdition: 'Simple edition'
    advancedEdition: 'Advanced edition'
    type: 'Aggregation type'
    typeHelper: 'Possible format of data'
    field: 'Concerned field'
    count: 'Max count of results'
    sort: 'Sort on field...'
    sortOrder: 'Sort order: {order}'
    subAggs: 'Sub aggregations'
  sortOrder:
    asc: 'ascending'
    desc: 'descending'
  errors:
    required: 'This field must be set'
    not_valid_json: "Given JSON isn't valid"
  types:
    auto_date_histogram: 'Auto date histogram'
    avg: 'Average (avg)'
    boxplot: 'Boxplot'
    cardinality: 'Unique count'
    categorize_text: 'Categorize text'
    date_histogram: 'Date histogram'
    diversified_sampler: 'Diversified sampler'
    extended_stats: 'Extended stats'
    geo_bounds: 'Geo bounds'
    geo_centroid: 'Geo centroid'
    histogram: 'Histogram'
    max: 'Maximum (max)'
    median_absolute_deviation: 'Median absolute deviation'
    min: 'Minimum (min)'
    percentiles: 'Percentiles'
    rare_terms: 'Rare terms'
    rate: 'Rate'
    sampler: 'Sampler'
    significant_terms: 'Significant terms'
    significant_text: 'Significant text'
    stats: 'Stats'
    string_stats: 'String stats'
    sum: 'Sum'
    terms: 'Terms'
    value_count: 'Value count'
    variable_width_histogram: 'Variable width histogram'
  sorts:
    _count: 'By doc count (_count)'
    _key: 'By key (_key)'
fr:
  headers:
    simpleEdition: 'Édition simple'
    advancedEdition: 'Édition avancée'
    type: "Type d'aggregation"
    typeHelper: 'Format probable des données'
    field: 'Champ concerné'
    count: 'Nombre de résultats maximum'
    sort: 'Trier sur le champ...'
    sortOrder: 'Sens du tri: {order}'
    subAggs: 'Sous aggregations'
  sortOrder:
    asc: 'ascendant'
    desc: 'descendant'
  errors:
    required: 'Ce champ doit être rempli'
    not_valid_json: "Le JSON donné n'est pas valide"
  types:
    auto_date_histogram: 'Histogramme de date automatique (auto_date_histogram)'
    avg: 'Moyenne (avg)'
    boxplot: 'Diagramme en boîte (boxplot)'
    cardinality: 'Compte unique (cardinality)'
    categorize_text: 'Catégoriser le texte (categorize_text)'
    date_histogram: 'Histogramme de date (date_histogram)'
    diversified_sampler: 'Échantillonneur diversifié (diversified_sampler)'
    extended_stats: 'Statistiques étendues (extended_stats)'
    geo_bounds: 'Limites géographiques (geo_bounds)'
    geo_centroid: 'Centroïde géographique (geo_centroid)'
    histogram: 'Histogramme (histogram)'
    max: 'Maximum (max)'
    median_absolute_deviation: 'Écart absolu médian (median_absolute_deviation)'
    min: 'Minimum (min)'
    percentiles: 'Percentiles (percentiles)'
    rare_terms: 'Termes rares (rare_terms)'
    rate: 'Taux (rate)'
    sampler: 'Échantillonneur (sampler)'
    significant_terms: 'Termes significatifs (significant_terms)'
    significant_text: 'Texte significatif (significant_text)'
    stats: 'Statistiques (stats)'
    string_stats: 'Statistiques de chaînes de caractères (string_stats)'
    sum: 'Somme (sum)'
    terms: 'Termes (terms)'
    value_count: 'Nombre de valeurs (value_count)'
    variable_width_histogram: 'Histogramme à largeur variable (variable_width_histogram)'
  sorts:
    _count: 'Par nombre de résultat (_count)'
    _key: 'Par clé (_key)'
</i18n>
