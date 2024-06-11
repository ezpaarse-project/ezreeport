<template>
  <v-card elevation="0">
    <v-card-subtitle class="d-flex pb-0">
      <!-- Name -->
      <slot name="title">
        <i18n path="$ezreeport.fetchOptions.aggSummary">
          <template #type>
            <span class="font-weight-medium">
              {{ $t(`$ezreeport.fetchOptions.agg_types.${type.value}`) }}
            </span>
          </template>

          <template #field>
            <span class="font-weight-medium">
              {{ type.data?.field ?? $t('unknown') }}
            </span>
          </template>
        </i18n>
      </slot>

      <v-spacer />

      <!-- Advanced edition switch -->
      <v-tooltip top>
        <template #activator="{ attrs, on }">
          <v-btn
            :disabled="isTooAdvanced"
            icon
            small
            @click="showAdvanced = !showAdvanced"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon small>mdi-{{ showAdvanced ? 'list-box-outline' : 'code-json' }}</v-icon>
          </v-btn>
        </template>

        <span>{{ $t(`headers.${showAdvanced ? 'simple' : 'advanced'}Edition`) }}</span>
      </v-tooltip>

      <slot name="toolbar" />
    </v-card-subtitle>

    <v-card-text>
      <v-form ref="form" v-model="valid">
        <!-- Simple edition -->
        <v-row v-if="!showAdvanced">
          <v-col>
            <!-- Type -->
            <v-autocomplete
              :value="type.value"
              :items="availableTypes"
              :label="$t('headers.type')"
              :readonly="readonly"
              :rules="rules.type"
              hide-details="auto"
              @change="onTypeUpdate"
            />

            <!-- Field -->
            <template v-if="!/^__/i.test(type.value)">
              <v-combobox
                :value="type.data?.field"
                :items="filteredMapping"
                :label="$t('headers.field')"
                :readonly="readonly"
                :rules="rules.field"
                :return-object="false"
                item-text="key"
                item-value="key"
                hide-details="auto"
                @input="onTypeFieldUpdate({ field: $event })"
              >
                <template #item="{ item, attrs, on }">
                  <v-list-item v-bind="attrs" v-on="on">
                    <v-list-item-content>
                      <v-list-item-title>{{ item.key }}</v-list-item-title>

                      <v-list-item-subtitle>{{ item.type }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </template>
              </v-combobox>
            </template>

            <div v-if="showOrder" class="mt-2">
              <div>
                <v-label>
                  {{$t('headers.sortOrder')}}
                </v-label>
              </div>

              <v-btn-toggle
                :value="(innerElement?.order === true ? 'asc' : innerElement?.order)"
                dense
                rounded
                color="primary"
                @change="onElementUpdate({ order: $event })"
              >
                <v-btn :disabled="readonly" value="asc" small outlined>
                  {{ $t('sortOrder.asc') }}
                </v-btn>

                <v-btn :disabled="readonly" value="desc" small outlined>
                  {{ $t('sortOrder.desc') }}
                </v-btn>
              </v-btn-toggle>
            </div>

            <v-divider v-if="typeDefinition?.returnsArray || typeDefinition?.subAggregations" class="my-4" />

            <!-- Show missing -->
            <CustomSection
              v-if="typeDefinition?.returnsArray"
              :label="$t('headers.showMissing').toString()"
              collapsable
            >
              <template #collapse>
                <v-switch
                  :input-value="!!type.data?.missing"
                  :readonly="readonly"
                  dense
                  hide-details
                  class="mt-0"
                  @change="onTypeFieldUpdate({
                    missing: ($event ? 'Non renseigné' : undefined),
                  })"
                  @click.prevent=""
                />
              </template>

              <v-text-field
                v-if="!!type.data?.missing"
                :value="type.data?.missing"
                :label="$t('headers.missing').toString()"
                :readonly="readonly"
                hide-details="auto"
                class="ml-2"
                @input="onTypeFieldUpdate({ missing: $event })"
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
              @input="innerJSON = $event"
              @blur="onJSONUpdate"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  aggsDefinition,
  getTypeDefinitionFromAggType,
  getTypeFromAgg,
  getUnknownKeysFromAgg,
  type AggDefinition,
  type ElasticAgg,
} from '~/lib/elastic/aggs';
import { cloneDeep, debounce } from 'lodash';
import type { SelectItem } from '~/types/vuetify';

const aggsSet = new Set<string>(Object.keys(aggsDefinition));

export default defineComponent({
  props: {
    /**
     * The current aggregation
     */
    element: {
      type: Object as PropType<ElasticAgg>,
      required: true,
    },
    /**
     * The index of the current aggregation
     */
    elementIndex: {
      type: Number,
      default: -1,
    },
    /**
     * Used names by aggregations
     */
    usedNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    /**
     * Should show order field
     */
    showOrder: {
      type: Boolean,
      default: false,
    },
    /**
     * Should be readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
    /**
     * Filter to apply when listing aggregations
     */
    aggFilter: {
      type: Function as PropType<(name: string, def: AggDefinition) => boolean>,
      default: () => true,
    },
    mapping: {
      type: Array as PropType<{ key: string, type: string }[]>,
      default: () => [],
    },
  },
  emits: {
    /**
     * Triggered when current aggregation is updated
     *
     * @param index The index of the current aggregation
     * @param el The new state of the aggregation
     */
    'update:element': (index: number, el: ElasticAgg) => index >= 0 && !!el,
    /**
     * Triggered when element is updated
     *
     * @param loading The new loading state
     */
    'update:loading': (loading: boolean) => loading !== undefined,
    /**
     * Triggered when validation state is updated
     *
     * @param valid The new validation state
     */
    'update:valid': (valid: boolean) => valid !== undefined,
  },
  data: () => ({
    showAdvanced: false,

    innerElement: {} as ElasticAgg,
    innerJSON: '',

    elementHash: '',

    innerValid: false,
  }),
  computed: {
    /**
     * Root keys in aggregations that are not handled by the simple mode
     */
    unknownKeys(): string[] {
      return getUnknownKeysFromAgg(this.innerElement);
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
      const value = getTypeFromAgg(this.innerElement) || '';

      return {
        value,
        data: this.innerElement[value],
      };
    },
    /**
     * Validation rules for fields
     */
    rules() {
      return {
        name: [
          (v: string) => v?.length > 0 || this.$t('$ezreeport.errors.empty', { field: 'aggregation/name' }),
          () => !this.isDuplicate || this.$t('errors.no_duplicate', { field: 'aggregation/name' }),
        ],
        type: [
          (v: string) => v?.length > 0 || this.$t('$ezreeport.errors.empty', { field: 'aggregation/type' }),
        ],
        field: [
          (v: string) => v?.length > 0 || this.$t('$ezreeport.errors.empty', { field: 'aggregation/field' }),
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
              return this.$t('$ezreeport.errors.json_format', { field: 'aggregation/advanced' });
            }
          },
        ],
      };
    },
    usedNamesSet() {
      return new Set(this.usedNames);
    },
    /**
     * Is the current name is a duplicate of any other agg
     */
    isDuplicate() {
      const name = this.innerElement.name || `agg${this.elementIndex}`;
      const currentName = this.element.name || `agg${this.elementIndex}`;
      if (currentName === name) { return false; }

      return this.usedNamesSet.has(name);
    },
    /**
     * Form validation state + name validation, which is outside of form
     */
    valid: {
      get(): boolean {
        return this.innerValid
          && this.rules.name.every((rule) => rule(this.innerElement.name ?? '') === true);
      },
      set(value: boolean) {
        this.innerValid = value;
        this.$emit('update:valid', value);
      },
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
    availableTypes(): SelectItem[] {
      const singleValue = {
        common: [] as SelectItem[],
        others: [] as SelectItem[],
      };
      const multiValues = {
        common: [] as SelectItem[],
        others: [] as SelectItem[],
      };

      const entries = Object.entries(aggsDefinition)
        .filter(([name, def]) => this.aggFilter(name, def));

      // eslint-disable-next-line no-restricted-syntax
      for (const [value, definition] of entries) {
        let text = value;

        const i18key = `$ezreeport.fetchOptions.agg_types.${value}`;
        if (this.$t(i18key) !== i18key) {
          text = this.$t(
            '$ezreeport.fetchOptions.agg_option',
            {
              label: this.$t(i18key),
              type: value,
            },
          ).toString();
        }

        const key = definition.common ? 'common' : 'others';
        const item = {
          text,
          value,
        };

        if (definition.returnsArray) {
          multiValues[key].push(item);
        } else {
          singleValue[key].push(item);
        }
      }

      // Merging all arrays
      const items: SelectItem[] = [];
      // Common single
      if (singleValue.common.length > 0) {
        items.push(
          { header: this.$t('groups.commonSingle').toString() },
          ...singleValue.common,
          { divider: true },
        );
      }
      // Common multi
      if (multiValues.common.length > 0) {
        items.push(
          { header: this.$t('groups.commonMulti').toString() },
          ...multiValues.common,
          { divider: true },
        );
      }
      // Other single
      if (singleValue.others.length > 0) {
        items.push(
          { header: this.$t('groups.otherSingle').toString() },
          ...singleValue.others,
          { divider: true },
        );
      }
      // Other multi
      if (multiValues.others.length > 0) {
        items.push(
          { header: this.$t('groups.otherMulti').toString() },
          ...multiValues.others,
          { divider: true },
        );
      }
      // Remove last divider
      items.pop();

      return items;
    },
    /**
     * Type definition of the aggregation
     */
    typeDefinition(): AggDefinition | undefined {
      return getTypeDefinitionFromAggType(this.type.value);
    },
    filteredMapping() {
      switch (this.type.value) {
        case 'auto_date_histogram':
        case 'date_histogram':
          return this.mapping.filter(({ type }) => type === 'date');

        default:
          return this.mapping;
      }
    },
  },
  watch: {
    element() {
      (this.$refs.form as any).validate();
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    /**
     * Init few variables
     */
    init() {
      this.innerElement = {
        ...cloneDeep(this.element),
        name: this.element.name || `agg${this.elementIndex}`,
      };

      this.showAdvanced = this.isTooAdvanced;
      (this.$refs.form as any).validate();
    },
    debouncedEmitUpdateElement: debounce(
      // eslint-disable-next-line func-names
      function (this: any) {
        this.$emit('update:element', this.elementIndex, this.innerElement);
        this.$emit('update:loading', false);
        return true;
      },
      1000,
    ),
    updateElement() {
      this.$emit('update:loading', true);
      this.debouncedEmitUpdateElement();
    },
    /**
     * When the aggregation is updated
     *
     * @param data The new data
     */
    onElementUpdate(data: Partial<ElasticAgg>) {
      this.innerElement = { ...this.innerElement, ...data };

      if (this.readonly) {
        return;
      }

      this.updateElement();
    },
    /**
     * When type of aggregation is updated
     *
     * @param type The new type
     */
    onTypeUpdate(type: string) {
      const el = { ...this.innerElement };
      delete el[this.type.value];
      el[type] = this.element[this.type.value] ?? {};
      this.innerElement = el;

      if (this.readonly || (!this.valid && !/^__/i.test(type))) {
        return;
      }

      this.updateElement();
    },
    /**
     * When field in type of aggregation is updated
     *
     * @param data The new data
     */
    onTypeFieldUpdate(data: Record<string, any>) {
      if (!this.type.value) {
        return;
      }

      this.onElementUpdate({
        [this.type.value]: {
          ...this.type.data,
          ...data,
        },
      });
    },
    /**
     * Update whole element using JSON
     */
    onJSONUpdate() {
      if (this.readonly || !this.valid || !this.innerJSON) {
        return;
      }

      this.innerElement = JSON.parse(this.innerJSON);
      this.updateElement();
    },
  },
});
</script>

<i18n lang="yaml">
en:
  headers:
    simpleEdition: 'Simple edition'
    advancedEdition: 'Advanced edition'
    type: 'Aggregation type'
    field: 'Concerned field'
    sortOrder: 'Sort results:'
    subAggs: 'Sub aggregations'
    showMissing: 'Should show missing ?'
    missing: 'Default value'
  sortOrder:
    asc: 'ascending'
    desc: 'descending'
  errors:
    no_duplicate: 'This name is already used'
  groups:
    commonSingle: 'Common metric aggregations'
    commonMulti: 'Common bucket aggregations'
    otherSingle: 'Metric aggregations'
    otherMulti: 'Common aggregations'
fr:
  headers:
    simpleEdition: 'Édition simple'
    advancedEdition: 'Édition avancée'
    type: "Type d'agrégation"
    field: 'Champ concerné'
    sortOrder: 'Trier les données:'
    subAggs: 'Sous aggregations'
    showMissing: 'Afficher les manquants ?'
    missing: 'Valeur par défaut'
  sortOrder:
    asc: 'ascendant'
    desc: 'descendant'
  errors:
    no_duplicate: 'Ce nom est déjà utilisé'
  groups:
    commonSingle: 'Agrégations de métriques communes' # TODO: Not really sure about that one
    commonMulti: 'Agrégations par groupes communes'
    otherSingle: 'Autres agrégations de métriques'
    otherMulti: 'Autres agrégations par groupes'
</i18n>
