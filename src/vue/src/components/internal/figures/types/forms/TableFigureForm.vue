<template>
  <v-row>
    <v-col>
      <FigureElasticForm
        :layout-id="layoutId"
        :readonly="readonly"
      />
    </v-col>

    <v-divider vertical class="mt-4" />

    <v-col>
      <v-form ref="form" v-model="valid">
        <v-combobox
          :value="figureParams?.dataKey"
          :label="$t('$ezreeport.fetchOptions.aggName')"
          :items="availableAggs"
          :readonly="readonly"
          hide-details="auto"
          @input="onParamUpdate({ dataKey: $event || undefined })"
        >
          <template #append-outer>
            <ElasticAggTypeHelper
              v-model="showDefinition"
              :agg="currentAgg"
            />
          </template>
        </v-combobox>

        <v-text-field
          :value="figureParams?.maxLength"
          :label="$t('headers.maxLength')"
          :readonly="readonly"
          type="number"
          @input="onParamUpdate({ maxLength: (+$event) >= 1 ? +$event : undefined })"
        />

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
            :data-key="figureParams.dataKey"
            :readonly="readonly"
            ref="columnsTable"
            @input="onParamUpdate({ columns: $event })"
            @update:totals="onParamUpdate({ totals: $event })"
            @update:col-styles="onParamUpdate({ columnStyles: $event })"
          />
        </CustomSection>

        <!-- Advanced -->
        <CustomSection v-if="unsupportedParams.shouldShow">
          <ToggleableObjectTree
            :value="unsupportedParams.value"
            :label="$t('$ezreeport.advanced_parameters').toString()"
            v-on="unsupportedParams.listeners"
          />
        </CustomSection>
      </v-form>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { omit, merge } from 'lodash';

import useTemplateStore from '~/stores/template';

import type TablePreviewFormConstructor from '../utils/TablePreviewForm.vue';
import type { PDFParams, PDFStyle, TableColumn } from '../utils/table';

type TablePreviewForm = InstanceType<typeof TablePreviewFormConstructor>;

const supportedKeys = [
  'dataKey',
  'title',
  'maxLength',
  'columns',
  'totals',
  'columnStyles',
];

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
    input: (val: PDFParams) => !!val,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    valid: false,

    showDefinition: false,
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
    unsupportedParams() {
      let listeners = {};
      if (!this.readonly && this.valid) {
        listeners = {
          input: (val: Record<string, any>) => {
            this.figureParams = merge({}, this.figureParams, val);
          },
        };
      }

      const value = omit(this.figure?.params ?? {}, supportedKeys);
      return {
        shouldShow: !this.readonly || Object.keys(value).length > 0,
        value,
        listeners,
      };
    },
    availableAggs() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );
      if (!layout || !layout.fetchOptions) {
        return [];
      }

      let available: string[] = [];
      const aggs = 'aggs' in layout.fetchOptions ? layout.fetchOptions.aggs : layout.fetchOptions.aggregations;
      if (Array.isArray(aggs)) {
        available = (aggs as { name: string }[]).map((agg, i) => agg.name || `agg${i}`);
      }

      if (layout.fetchOptions?.fetchCount) {
        available.push(layout.fetchOptions.fetchCount.toString());
      }
      return available;
    },
    /**
     * Current aggregation targeted
     */
    currentAgg() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );

      if (!layout?.fetchOptions || !this.figureParams) {
        return undefined;
      }

      const aggs = 'aggs' in layout.fetchOptions ? layout.fetchOptions.aggs : layout.fetchOptions.aggregations;
      return (aggs as any[]).find(({ name }) => name === this.figureParams?.dataKey);
    },
  },
  mounted() {
    (this.$refs.form as any)?.validate();
  },
  methods: {
    onParamUpdate(data: Partial<PDFParams>) {
      if (this.valid && this.figureParams) {
        this.figureParams = { ...this.figureParams, ...data };
      }
    },
    onColumnCreated() {
      (this.$refs.columnsTable as TablePreviewForm | undefined)?.createColumn();
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
fr:
  headers:
    maxLength: 'Nombre maximum de lignes'
    columns: 'Colonnes'
</i18n>
