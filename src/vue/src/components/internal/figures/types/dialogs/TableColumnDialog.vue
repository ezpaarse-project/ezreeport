<template>
  <v-dialog
    :value="value"
    :persistent="!valid || loading"
    absolute
    max-width="450"
    min-width="450"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-form v-model="valid">
        <v-card-title>
          <v-text-field
            :value="column.header"
            :label="$t('headers.header')"
            :rules="rules.header"
            :readonly="readonly"
            hide-details="auto"
            @input="onColumnUpdated({ header: $event })"
          />
        </v-card-title>

        <v-card-text>
          <v-checkbox
            :label="$t('headers.total')"
            :input-value="total"
            :readonly="readonly"
            hide-details
            class="mt-0"
            @change="$emit('update:total', $event)"
          />

          <ElasticAggElementForm
            v-if="bucket"
            :element="bucket"
            :readonly="readonly"
            :agg-filter="aggFilter"
            :style="{
              border: $vuetify.theme.dark ? 'thin solid rgba(255, 255, 255, 0.12)' : 'thin solid rgba(0, 0, 0, 0.12)',
            }"
            @update:element="(i, el) => $emit('update:bucket', el)"
            @update:loading="(val) => {
              loading = val;
              $emit('loading', val);
            }"
          >
            <template v-slot:title>
              <div class="d-flex align-center">
                {{ $t('headers.linkedAgg') }}

                <v-progress-circular v-if="loading" indeterminate size="16" width="2" class="ml-2" />
              </div>
            </template>
          </ElasticAggElementForm>

          <!-- Style -->
          <CustomSection
            :label="$t('headers.style.title').toString()"
            :default-value="true"
            collapsable
          >
            <v-row>
              <v-col>
                <v-select
                  :value="colStyle.overflow"
                  :label="$t('headers.style.overflow')"
                  :items="overflowOptions"
                  :placeholder="$t('overflow_list.ellipsize')"
                  persistent-placeholder
                  hide-details
                  @change="onColStyleUpdate({ overflow: $event })"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col class="button-group-col">
                <v-label>
                  {{ $t('headers.style.halign') }}
                </v-label>

                <v-btn-toggle
                  :value="colStyle.halign || 'left'"
                  mandatory
                  dense
                  rounded
                  color="primary"
                  @change="onColStyleUpdate({ halign: $event })"
                >
                  <v-btn
                    v-for="align in haligns"
                    :key="`h-${align}`"
                    :value="align"
                    outlined
                  >
                    <v-icon>mdi-format-align-{{ align }}</v-icon>
                  </v-btn>
                </v-btn-toggle>
              </v-col>

              <v-col class="button-group-col">
                <v-label>
                  {{ $t('headers.style.valign') }}
                </v-label>

                <v-btn-toggle
                  :value="colStyle.valign || 'center'"
                  mandatory
                  dense
                  rounded
                  color="primary"
                  @change="onColStyleUpdate({ valign: $event })"
                >
                  <v-btn
                    v-for="align in valigns"
                    :key="`v-${align}`"
                    :value="align"
                    outlined
                  >
                    <v-icon>mdi-format-align-{{ align }}</v-icon>
                  </v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>
          </CustomSection>

          <!-- Advanced -->
          <CustomSection v-if="unsupportedParams.shouldShow">

            <ToggleableObjectTree
              :value="unsupportedParams.value"
              :label="$t('$ezreeport.advanced_parameters').toString()"
              v-on="unsupportedParams.listeners"
            />
          </CustomSection>
        </v-card-text>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { merge, omit, pick } from 'lodash';

import type { AggDefinition, ElasticAgg } from '~/lib/elastic/aggs';

import type { PDFStyle, TableColumn } from '../utils/table';

/**
 * Keys of label supported by the popover
 */
const supportedKeys = [
  '_',
  'header',
];

/**
 * Possible overflow for text
 */
const possibleOverflows = [
  'linebreak',
  'ellipsize',
  'visible',
  'hidden',
] as const;

const haligns = ['left', 'right', 'center', 'justify'] as const;
const valigns = ['top', 'middle', 'bottom'] as const;

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
     * Current column edited
     */
    column: {
      type: Object as PropType<TableColumn>,
      required: true,
    },
    /**
     * Should show total of column
     */
    total: {
      type: Boolean,
      default: false,
    },
    /**
     * Should show total of column
     */
    colStyle: {
      type: Object as PropType<PDFStyle>,
      default: () => ({}),
    },
    /**
     * Bucket of the column
     */
    bucket: {
      type: Object as PropType<ElasticAgg | undefined>,
      default: undefined,
    },
    /**
     * Is the dialog readonly
     */
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    loading: (loading: boolean) => loading !== undefined,
    'update:column': (element: TableColumn) => !!element,
    'update:total': (total: boolean) => total !== undefined,
    'update:colStyle': (style: PDFStyle) => !!style,
    'update:bucket': (bucket: ElasticAgg) => !!bucket,
  },
  data: () => ({
    valid: false,
    loading: false,

    haligns,
    valigns,
  }),
  computed: {
    /**
     * Validation rules
     */
    rules() {
      return {
        header: [
          (v: string) => v.length > 0 || this.$t('$ezreeport.errors.empty', { field: 'table/header' }),
        ],
      };
    },
    /**
     * Data used by ObjectTree to edit unsupported options
     */
    unsupportedParams() {
      let listeners = {};
      if (!this.readonly) {
        listeners = {
          input: (val: Record<string, any>) => {
            const column = pick(this.column, supportedKeys);
            this.$emit('update:column', merge({}, column as TableColumn, val));
          },
        };
      }

      const value = omit(this.column, supportedKeys);
      return {
        shouldShow: !this.readonly || Object.keys(value).length > 0,
        value,
        listeners,
      };
    },
    overflowOptions() {
      return possibleOverflows.map((value) => ({
        text: this.$t(`overflow_list.${value}`).toString(),
        value,
      })).sort((a, b) => a.text.localeCompare(b.text));
    },
  },
  methods: {
    onColumnUpdated(data: Partial<TableColumn>) {
      if (this.valid) {
        this.$emit('update:column', { ...this.column, ...data });
      }
    },
    onColStyleUpdate(data: Partial<PDFStyle>) {
      if (this.valid) {
        this.$emit('update:colStyle', { ...this.colStyle, ...data });
      }
    },
    aggFilter(name: string, def: AggDefinition): boolean {
      return def.returnsArray;
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
</style>

<i18n lang="yaml">
en:
  headers:
    dataKey: 'Key to get data'
    header: 'Name of the column'
    total: 'Show total of column'
    style:
      title: 'Styling options'
      overflow: 'Overflow'
      valign: "Vertical align"
      halign: "Horizontal align"
  overflow_list:
    linebreak: 'Line break'
    ellipsize: 'Shorten using ellipsis'
    visible: 'Visible'
    hidden: 'Hidden'
  errors:
    no_duplicate: 'This key is already used'
fr:
  headers:
    dataKey: 'Clé a utiliser pour récupérer les données'
    header: 'Nom de la colonne'
    total: 'Afficher le total de la colonne'
    style:
      title: 'Options de style'
      overflow: 'Débordement'
      valign: "Alignement vertical"
      halign: "Alignement horizontal"
  overflow_list:
    linebreak: 'Retour à la ligne'
    ellipsize: 'Mettre des points de suspensions'
    visible: 'Laisser dépasser'
    hidden: 'Tronquer'
  errors:
    no_duplicate: 'Cette clé est déjà utilisé'
</i18n>
