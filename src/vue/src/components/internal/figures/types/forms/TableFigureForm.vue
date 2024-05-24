<template>
  <v-row>
    <v-col>
      <FigureElasticForm
        :layout-id="layoutId"
        :id="id"
        :readonly="readonly"
        hide-fetch-count
        @update:fetchOptions="$emit('update:fetchOptions', $event)"
      />

      <v-form ref="form" v-model="valid">
        <ElasticAggElementForm
          :element="buckets.metric ?? defaultMetric"
          :mapping="templateStore.indices.mapping"
          :readonly="readonly"
          :agg-filter="aggFilter"
          :style="{
            border: $vuetify.theme.dark ? 'thin solid rgba(255, 255, 255, 0.12)' : 'thin solid rgba(0, 0, 0, 0.12)',
          }"
          show-order
          @update:element="(i, el) => onMetricUpdate(el)"
          @update:loading="colLoading = $event"
        >
          <template v-slot:title>
            <div class="d-flex align-center">
              {{ $t('headers.metric') }}

              <v-progress-circular v-if="colLoading" indeterminate size="16" width="2" class="ml-2" />
            </div>
          </template>
        </ElasticAggElementForm>

        <CustomSection :label="$t('headers.columns').toString()">
          <template #actions v-if="!readonly">
            <v-btn
              :disabled="!valid"
              icon
              x-small
              color="success"
              @click="onColumnCreated"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>

          <TablePreviewForm
            v-if="figureParams"
            :value="figureParams.columns"
            :totals="figureParams.totals"
            :col-styles="figureParams.columnStyles"
            :buckets="buckets.value"
            :metric="buckets.metric"
            :mapping="templateStore.indices.mapping"
            :readonly="readonly"
            ref="columnsTable"
            @input="onParamUpdate({ columns: $event })"
            @update:totals="onParamUpdate({ totals: $event })"
            @update:col-styles="onParamUpdate({ columnStyles: $event })"
            @update:buckets="onBucketUpdate($event)"
          />
        </CustomSection>

        <v-text-field
          :value="figureParams?.maxLength"
          :label="$t('headers.maxLength')"
          :readonly="readonly"
          type="number"
          @input="onParamUpdate({ maxLength: (+$event) >= 1 ? +$event : undefined })"
        />
      </v-form>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import type { AnyFetchOption } from '~/lib/templates/customTemplates';
import type { AggDefinition, ElasticAgg } from '~/lib/elastic/aggs';

import useTemplateStore from '~/stores/template';

import type TablePreviewFormConstructor from '../utils/TablePreviewForm.vue';
import type { PDFParams, PDFStyle, TableColumn } from '../utils/table';

type TablePreviewForm = InstanceType<typeof TablePreviewFormConstructor>;

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
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    'update:fetchOptions': (data: Partial<AnyFetchOption>) => !!data,
    childOpen: (isOpen: boolean) => isOpen !== undefined,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    valid: false,
    defaultMetric: { name: 'aggMetric', __count: undefined },
    colLoading: false,
  }),
  computed: {
    figure() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );

      return layout?.figures.find(({ _: { id } }) => id === this.id);
    },
    figureParams: {
      get(): PDFParams | undefined {
        if (!this.figure?.params) {
          return undefined;
        }

        const params: PDFParams = { dataKey: '', columns: [] };
        if ('dataKey' in this.figure.params && typeof this.figure.params.dataKey === 'string') {
          params.dataKey = this.figure.params.dataKey;
        }

        if ('columns' in this.figure.params && Array.isArray(this.figure.params.columns)) {
          // TODO: Better Validation
          params.columns = this.figure.params.columns as TableColumn[];
        }

        if ('totals' in this.figure.params && Array.isArray(this.figure.params.totals)) {
          // TODO: Better Validation
          params.totals = this.figure.params.totals as string[];
        }

        if ('columnStyles' in this.figure.params && !Array.isArray(this.figure.params.columnStyles)) {
          // TODO: Better Validation
          params.columnStyles = this.figure.params.columnStyles as Record<string, PDFStyle>;
        }

        if ('maxLength' in this.figure.params && typeof this.figure.params.maxLength === 'number') {
          // TODO: Better Validation
          params.maxLength = this.figure.params.maxLength;
        }

        return params;
      },
      set(params: PDFParams) {
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
    buckets() {
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
  },
  mounted() {
    (this.$refs.form as any)?.validate();

    // Watch for child popovers
    this.$watch(
      () => (this.$refs.columnsTable as TablePreviewForm | undefined)?.columnPopoverShown,
      (value) => this.$emit('childOpen', value || false),
    );
  },
  methods: {
    onParamUpdate(data: Partial<PDFParams>) {
      if (this.valid && this.figureParams) {
        this.figureParams = { ...this.figureParams, ...data };
      }
    },
    onColumnCreated(e: MouseEvent) {
      (this.$refs.columnsTable as TablePreviewForm | undefined)?.onCreateColumn(e);
    },
    onMetricUpdate(el: ElasticAgg) {
      if ('__count' in { ...el }) {
        this.$emit('update:fetchOptions', { metric: undefined });
      } else {
        this.$emit('update:fetchOptions', { metric: el });
      }
    },
    onBucketUpdate(buckets: ElasticAgg[]) {
      this.onParamUpdate({ dataKey: buckets[0]?.name });
      this.$emit('update:fetchOptions', { buckets });
    },
    aggFilter(name: string, def: AggDefinition): boolean {
      return !def.returnsArray;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    maxLength: 'Maximum count of rows'
    columns: 'Columns'
    metric: 'Metric'
fr:
  headers:
    maxLength: 'Nombre maximum de lignes'
    columns: 'Colonnes'
    metric: 'Metric'
</i18n>
