<template>
  <v-row>
    <v-col>
      <FigureElasticForm
        :layout-id="layoutId"
        :id="id"
        :readonly="readonly"
        hide-fetch-count
      />

      <v-form v-if="figureParams" v-model="valid">
        <!-- Label -->
        <CustomSection
          :label="headers.label"
          collapsable
        >
          <ElasticAggElementForm
            :element="buckets.value[0] ?? {}"
            :element-index="0"
            :readonly="readonly"
            :agg-filter="bucketFilter"
            :style="{
              marginTop: '1rem',
              border: $vuetify.theme.dark ? 'thin solid rgba(255, 255, 255, 0.12)' : 'thin solid rgba(0, 0, 0, 0.12)',
            }"
            @update:element="(i, el) => onBucketUpdate(i, el)"
            @update:loading="labelLoading = $event"
          >
            <template v-slot:title>
              <div class="d-flex align-center">
                {{ $t('headers.agg') }}

                <v-progress-circular v-if="labelLoading" indeterminate size="16" width="2" class="ml-2" />
              </div>
            </template>
          </ElasticAggElementForm>

          <v-text-field
            v-if="figure?.type !== 'arc'"
            :value="figureParams.label?.title"
            :label="$t('label.headers.title')"
            :readonly="readonly"
            hide-details
            @input="onSubParamUpdate('label', { title: $event })"
          />

          <CustomSection v-if="legendLabelSection" :label="legendLabelSection" collapsable>
            <template #collapse>
              <v-switch
                :input-value="figureParams.label?.legend !== null"
                :readonly="readonly"
                dense
                hide-details
                class="mt-0"
                @change="onSubParamUpdate('label', { legend: $event ? {} : null })"
                @click.prevent=""
              />
            </template>

            <template v-if="figureParams.label?.legend !== null">
              <v-text-field
                v-if="figure?.type === 'arc'"
                :value="figureParams.label?.title"
                :label="$t('label.headers.legendTitle')"
                :readonly="readonly"
                :placeholder="figureParams.label?.field"
                persistent-placeholder
                hide-details
                @input="onSubParamUpdate('label', { title: $event })"
              />
            </template>
          </CustomSection>
        </CustomSection>

        <!-- Value -->
        <CustomSection
          :label="headers.value"
          collapsable
        >
          <ElasticAggElementForm
            :element="buckets.metric || defaultMetric"
            :readonly="readonly"
            :agg-filter="metricFilter"
            @update:element="(i, el) => onMetricUpdate(el)"
            @update:loading="metricLoading = $event"
          >
            <template v-slot:title>
              <div class="d-flex align-center">
                {{ $t('headers.agg') }}

                <v-progress-circular v-if="metricLoading" indeterminate size="16" width="2" class="ml-2" />
              </div>
            </template>
          </ElasticAggElementForm>

          <v-text-field
            v-if="figure?.type !== 'arc'"
            :value="figureParams.value?.title"
            :label="$t('value.headers.title')"
            :readonly="readonly"
            @input="onSubParamUpdate('value', { title: $event })"
          />
        </CustomSection>

        <!-- Color -->
        <CustomSection
          v-if="figure?.type !== 'arc'"
          :value="!buckets.value.at(0) || collapsedColor"
          :label="headers.color"
          collapsable
        >
          <template #collapse>
            <v-btn
              v-if="!!buckets.value.at(1)"
              icon
              x-small
              @click="collapsedColor = !collapsedColor"
            >
              <v-icon>mdi-chevron-{{ collapsedColor === false ? 'up' : 'down' }}</v-icon>
            </v-btn>

            <v-switch
              :input-value="!!buckets.value.at(1)"
              :readonly="readonly"
              :disabled="!buckets.value.at(0)"
              dense
              hide-details
              class="mt-0"
              @change="(ev) => {
                collapsedColor = !ev;
                const b = buckets.value.at(1);
                if (!ev && b) {
                  onBucketDeletion(b);
                }
              }"
              @click.prevent=""
            />
          </template>

          <ElasticAggElementForm
            :element="buckets.value[1] ?? {}"
            :element-index="1"
            :readonly="readonly"
            :agg-filter="bucketFilter"
            :style="{
              marginTop: '1rem',
              border: $vuetify.theme.dark ? 'thin solid rgba(255, 255, 255, 0.12)' : 'thin solid rgba(0, 0, 0, 0.12)',
            }"
            @update:element="(i, el) => onBucketUpdate(i, el)"
            @update:loading="colorLoading = $event"
          >
            <template v-slot:title>
              <div class="d-flex align-center">
                {{ $t('headers.agg') }}

                <v-progress-circular v-if="colorLoading" indeterminate size="16" width="2" class="ml-2" />
              </div>
            </template>
          </ElasticAggElementForm>

          <v-text-field
            :value="figureParams.color?.title"
            :label="$t('value.headers.title')"
            :readonly="readonly"
            @input="onSubParamUpdate('value', { title: $event })"
          />
        </CustomSection>

        <!-- Data Labels -->
        <CustomSection
          :value="!figureParams.dataLabel || collapsedDl"
          :label="$t(figureParams.dataLabel ? 'headers.dataLabel' : 'dataLabel.headers.show').toString()"
          collapsable
        >
          <template #collapse>
            <v-btn
              v-if="!!figureParams.dataLabel"
              icon
              x-small
              @click="collapsedDl = !collapsedDl"
            >
              <v-icon>mdi-chevron-{{ collapsedDl === false ? 'up' : 'down' }}</v-icon>
            </v-btn>

            <v-switch
              :input-value="!!figureParams.dataLabel"
              :readonly="readonly"
              dense
              hide-details
              class="mt-0"
              @change="(ev) => {
                onDataLabelUpdate({ format: ev ? 'numeric' : null })
                collapsedDl = !ev;
              }"
              @click.prevent=""
            />
          </template>

          <template v-if="figureParams.dataLabel">
            <v-row>
              <v-col>
                <v-select
                  :value="figureParams.dataLabel.format"
                  :items="possibleDataLabelFormats"
                  :label="$t('dataLabel.headers.format')"
                  :readonly="readonly"
                  hide-details
                  @change="onDataLabelUpdate({ format: $event })"
                />
              </v-col>

              <v-col class="button-group-col">
                <v-label>
                  {{ $t('dataLabel.headers.position') }}
                </v-label>

                <v-btn-toggle
                  :value="figureParams.dataLabel.position || 'in'"
                  dense
                  rounded
                  color="primary"
                  @change="onDataLabelUpdate({ position: $event })"
                >
                  <v-btn
                    v-for="pos in possibleDataLabelPositions"
                    :key="`dlPos-${pos.value}`"
                    :value="pos.value"
                    :disabled="readonly"
                    small
                    outlined
                  >
                    {{ pos.text }}
                  </v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>

            <v-row>
              <v-col class="button-group-col">
                <v-label>
                  {{$t('dataLabel.headers.shouldShow')}}
                </v-label>

                <v-btn-toggle
                  :value="figureParams.dataLabel.showLabel || false"
                  dense
                  rounded
                  color="primary"
                  @change="onDataLabelUpdate({ showLabel: $event })"
                >
                  <v-btn :disabled="readonly" :value="false" small outlined>
                    {{ $t('dataLabel.headers.showValue') }}
                  </v-btn>

                  <v-btn :disabled="readonly" :value="true" small outlined>
                    {{ $t('dataLabel.headers.showLabels') }}
                  </v-btn>
                </v-btn-toggle>
              </v-col>

              <!-- DL Preview -->
              <v-col class="button-group-col">
                <v-label>
                  {{$t('dataLabel.headers.preview')}}
                </v-label>

                <div
                  :class="['dL-preview', figureParams.dataLabel.position || 'in']"
                  :style="dataLabelPreviewStyle"
                >
                  <div v-if="figureParams.dataLabel.showLabel">
                    Lorem Ipsum
                  </div>
                  <div>
                    <strong>
                      {{ randomValue }}
                    </strong>
                    <strong v-if="figureParams.dataLabel.format === 'percent'" class="ml-1">
                      %
                    </strong>
                  </div>
                </div>
              </v-col>
            </v-row>

          </template>
        </CustomSection>
      </v-form>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { pick, merge, omit } from 'lodash';
import chroma from 'chroma-js';
import { v4 as uuid } from 'uuid';

import { AnyFetchOption } from '~/lib/templates/customTemplates';
import { AggDefinition, ElasticAgg } from '~/lib/elastic/aggs';

import useTemplateStore from '~/stores/template';

/**
 * Possible formats for data labels
 */
const dataLabelFormats = [
  'percent',
  'numeric',
];

/**
 * Possible positions for data labels
 */
const dataLabelPositions = [
  'in',
  'out',
];

type VegaParams = {
  dataKey: string,
  value: Record<string, any>,
  label: Record<string, any>,
  color: Record<string, any>,
  dataLabel?: {
    format: string,
    showLabel?: boolean,
    minValue?: number,
    position?: string,
  },
};
type SubVegaParamsKeys = Exclude<keyof VegaParams, 'title' | 'dataKey'>;

type DataLabelUpdate = {
  format?: string | null,
  showLabel?: boolean,
  minValue?: number,
  position?: string,
};

/**
 * Used to detect unsupported params
 *
 * Should reflect VegaParams
 */
const supportedParams = {
  title: '',
  value: {
    title: '',
  },
  color: {
    field: '',
    title: '',
  },
  label: {
    title: '',
    legend: {},
  },
  dataLabel: {
    format: '',
    showLabel: [false, undefined],
    minValue: [0, undefined],
    position: '',
  },
};

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
    layoutId: {
      type: String,
      required: true,
    },
    /**
     * Is the form readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (val: VegaParams) => !!val,
    'update:fetchOptions': (data: Partial<AnyFetchOption>) => !!data,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    valid: false,
    defaultMetric: { name: 'aggMetric', __count: undefined },

    labelLoading: false,
    metricLoading: false,
    colorLoading: false,

    collapsedDl: true,
    collapsedColor: true,
  }),
  computed: {
    randomValue() {
      return (Math.random() * 100).toFixed();
    },
    layout() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );

      return layout;
    },
    figure() {
      const figure = this.layout?.figures.find(({ _: { id } }) => id === this.id);
      return figure;
    },
    figureParams: {
      get(): VegaParams | undefined {
        if (!this.figure?.params) {
          return undefined;
        }
        // TODO: Better Validation
        return this.figure.params as VegaParams;
      },
      set(params: VegaParams) {
        if (!this.figure) {
          return;
        }

        this.templateStore.UPDATE_FIGURE(
          this.layoutId,
          this.id,
          {
            ...this.figure,
            params: {
              title: this.figure.params?.title,
              ...params,
            },
          },
        );
      },
    },
    /**
     * Buckets used by the figure
     */
    buckets(): { value: ElasticAgg[], metric?: ElasticAgg } {
      if (!this.figure?.fetchOptions) {
        return { value: [], metric: undefined };
      }

      if (
        ('buckets' in this.figure.fetchOptions && this.figure.fetchOptions.buckets)
        || ('metric' in this.figure.fetchOptions && this.figure.fetchOptions.metric)
      ) {
        return {
          value: this.figure.fetchOptions.buckets ?? [],
          metric: this.figure.fetchOptions.metric,
        };
      }

      return { value: [], metric: undefined };
    },
    /**
     * Possible formats for data labels with localisation
     */
    possibleDataLabelFormats() {
      return dataLabelFormats.map((value) => ({
        text: this.$t(`dataLabel.formats.${value}`),
        value,
      }));
    },
    /**
     * Possible positions for data labels with localisation
     */
    possibleDataLabelPositions() {
      return dataLabelPositions.map((value) => ({
        text: this.$t(`dataLabel.positions.${value}`),
        value,
      }));
    },
    /**
     * Data used by ObjectTree to edit unsupported options
     */
    unsupportedParams() {
      const diff = this.objectDiff(this.figureParams ?? {}, supportedParams);

      let listeners = {};
      if (!this.readonly) {
        listeners = {
          input: (val: Record<string, any>) => {
            const params = omit(this.figureParams, diff);
            this.figureParams = merge({}, params as VegaParams, val);
          },
        };
      }

      return {
        shouldShow: !this.readonly || diff.length > 0,
        value: pick(this.figureParams, diff),
        listeners,
      };
    },
    /**
     * Label to show in legend legend
     */
    legendLabelSection() {
      let key = '';
      switch (this.figure?.type) {
        case 'bar':
          break;

        case 'arc':
          key = this.figureParams?.label?.legend !== null ? 'label.headers.legendParams' : 'label.headers.showLegend';
          break;

        default:
          key = 'label.headers.showLegend';
          break;
      }

      return key && this.$t(key).toString();
    },
    /**
     * CSS style for previewing data labels
     */
    dataLabelPreviewStyle(): Record<string, any> {
      const { primary } = this.$vuetify.theme.currentTheme;

      let background = '';
      if (typeof primary === 'string') {
        background = primary;
      } else if (typeof primary === 'number') {
        background = primary.toString();
      } else {
        background = primary?.base || '#1976D2';
      }

      let color: string | undefined;
      if (
        !this.figureParams?.dataLabel?.position
        || this.figureParams.dataLabel.position === 'in'
      ) {
        color = chroma.contrast(background, 'black') > 5 ? 'black' : 'white';
      }

      return {
        '--preview-color': background,
        '--preview-radius': this.figure?.type === 'arc' && '100% 100% 0 0',
        color,
      };
    },
    /**
     * Various headers for form parts
     */
    headers() {
      return Object.fromEntries(
        ['label', 'value', 'color'].map(
          (type) => {
            let label = this.$t(`headers.${type}._default`).toString();
            if (this.$te(`headers.${type}.${this.figure?.type}`)) {
              label = this.$t(`headers.${type}.${this.figure?.type}`).toString();
            }
            return [type, label];
          },
        ),
      ) as Record<'label' | 'value' | 'color', string>;
    },
  },
  mounted() {
    // Default values (very common)
    if (!this.buckets.metric) {
      this.onMetricUpdate(this.defaultMetric);
    }
  },
  methods: {
    /**
     * Gets difference between 2 objects
     *
     * @param v1 First object to compare
     * @param v2 Second object to compare
     * @param prefix Prefix of returned keys. Should be empty on the first iteration
     *
     * @returns Keys that aren't the same in v1 but not in v2
     */
    objectDiff(
      v1: Record<string, any>,
      v2: Record<string, any>,
      prefix = '',
    ) {
      const diffs = Object.keys(v1 ?? {}).reduce(
        (d: string[], key: string) => {
          const prefixedKey = `${prefix}${key}`;
          if (
            Array.isArray(v2[key])
              ? !v2[key].map((v: any) => typeof v).includes(typeof v1[key])
              : typeof v1[key] !== typeof v2[key]
          ) {
            d.push(prefixedKey);
          } else if (typeof v1[key] === 'object' && !Array.isArray(v1[key])) {
            d.push(
              ...this.objectDiff(
                v1[key],
                v2[key],
                `${prefixedKey}.`,
              ),
            );
          }
          return d;
        },
        [],
      );
      return diffs;
    },
    onParamUpdate(data: Partial<VegaParams>) {
      if (this.valid && this.figureParams) {
        this.figureParams = { ...this.figureParams, ...data };
      }
    },
    onSubParamUpdate<T extends SubVegaParamsKeys>(subParam: T, data: Partial<VegaParams[T]>) {
      if (!this.figureParams) {
        return;
      }

      const subParamValue = {
        ...(this.figureParams[subParam] ?? {}),
        ...(data ?? {}),
      };
      this.onParamUpdate({ [subParam]: subParamValue });
    },
    onDataLabelUpdate(data: DataLabelUpdate) {
      if (data.format === null) {
        this.onParamUpdate({ dataLabel: undefined });
        return;
      }
      this.onSubParamUpdate('dataLabel', data as Partial<VegaParams['dataLabel']>);
    },
    metricFilter(name: string, def: AggDefinition): boolean {
      return !def.returnsArray;
    },
    bucketFilter(name: string, def: AggDefinition): boolean {
      return def.returnsArray;
    },
    onBucketDeletion(bucket: ElasticAgg) {
      let buckets: ElasticAgg[] = [];
      if (this.figure?.fetchOptions && 'aggs' in this.figure.fetchOptions) {
        buckets = this.figure.fetchOptions.aggs ?? [];
      }

      const index = buckets.findIndex((b) => b.name === bucket.name);
      if (index >= 0) {
        buckets.splice(index, 1);
        this.$emit('update:fetchOptions', { buckets });
      }
    },
    onBucketUpdate(index = -1, bucket: Partial<ElasticAgg> = {}) {
      const value: ElasticAgg = {
        ...bucket,
        name: uuid().split('-')[0],
      };

      const buckets = [...this.buckets.value];

      if (index < 0) {
        buckets.push(value);
      } else {
        buckets.splice(index, 1, value);
      }

      this.onParamUpdate({ dataKey: buckets[0]?.name || 'agg0' });
      if (buckets[1]) {
        this.onSubParamUpdate('color', { field: `${buckets[1].name || 'agg1'}.key` });
      }
      this.$emit('update:fetchOptions', { buckets });
    },
    onMetricUpdate(el: ElasticAgg) {
      const buckets = this.buckets.value.slice(1);
      let field = `${el.name ?? 'aggMetric'}.value`;
      if ('__count' in { ...el }) {
        field = 'doc_count';
        this.$emit('update:fetchOptions', { metric: undefined });
      } else {
        this.$emit('update:fetchOptions', { metric: el });
      }

      field = [...buckets.map(({ name }, i) => name || `agg${i}`), field].join('.');

      this.onSubParamUpdate('value', { field });
      this.onSubParamUpdate('label', { field: 'key' });
    },
  },
});
</script>

<style scoped>
.button-group-col {
  position: relative;
}

.button-group-col:deep(.v-label) {
  position: absolute !important;
  max-width: 133%;
  transform-origin: top left;
  transform: translateY(4px) translateX(12px) scale(.75);
}

.button-group-col:deep(.v-label) + * {
  margin-top: 1rem;
  transform: translateY(4px);
}

.dL-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 0.5rem 0;
  transition: color 0.5s;
}

.dL-preview > div {
  z-index: 1;
}

.dL-preview::before {
  content: '';
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: var(--preview-color);
  border-radius: var(--preview-radius);
  transition: top 0.5s, color 0.5s;
}
.dL-preview.in::before {
  top: 0;
  left: 0;
}
.dL-preview.out::before {
  top: 90%;
  left: 0;
}
</style>

<i18n lang="yaml">
en:
  headers:
    agg: 'Aggregation'
    value:
      _default: 'Data parameters'
      bar: 'Y-axis'
    label:
      _default: 'Series parameter'
      arc: 'Slices parameters'
      bar: 'X-axis'
    color:
      _default: 'Group parameter'
    dataLabel: 'Data Labels parameters'
  value:
    headers:
      field: 'Field'
      title: 'Title of axis'
  label:
    headers:
      field: 'Field'
      title: 'Title of axis'
      legendTitle: "Legend's title"
      legendParams: 'Legend parameters'
      showLegend: 'Should show legend ?'
  dataLabel:
    headers:
      show: 'Should show values on chart ?'
      format: 'Values format'
      shouldShow: 'Should be shown :'
      preview: 'Preview :'
      showValue: 'Values'
      showLabels: 'Values & Series'
      position: 'Position :'
    formats:
      numeric: 'Numeric'
      percent: 'Percent'
    positions:
      in: 'In'
      out: 'Out'
fr:
  headers:
    agg: 'Aggregation'
    value:
      _default: 'Paramètres des données'
      bar: 'Axe Y'
    label:
      _default: 'Paramètres des séries'
      arc: 'Paramètres des parts'
      bar: 'Axe X'
    color:
      _default: 'Paramètres des groupes'
    dataLabel: 'Paramètres des étiquettes de données'
  value:
    headers:
      field: 'Champ'
      title: "Titre de l'axe"
  label:
    headers:
      field: 'Champ'
      title: "Titre de l'axe"
      legendTitle: "Titre des légendes"
      legendParams: 'Paramètres de la légende'
      showLegend: 'Afficher la légende ?'
  dataLabel:
    headers:
      show: 'Afficher les étiquettes de données ?'
      format: 'Format des données'
      shouldShow: 'Doit être affiché :'
      preview: 'Prévisualisation :'
      showValue: 'Valeurs'
      showLabels: 'Valeurs & Séries'
      position: 'Position :'
    formats:
      numeric: 'Numérique'
      percent: 'Pourcentage'
    positions:
      in: 'Intérieur'
      out: 'Extérieur'
</i18n>
