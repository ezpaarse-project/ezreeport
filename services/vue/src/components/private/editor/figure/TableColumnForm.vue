<template>
  <v-card
    :title="
      modelValue
        ? $t('$ezreeport.editor.figures.table.columns.title:edit')
        : $t('$ezreeport.editor.figures.table.columns.title:new')
    "
    prepend-icon="mdi-playlist-plus"
  >
    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row>
          <v-col>
            <v-text-field
              v-model="column.header"
              :label="$t('$ezreeport.editor.figures.table.columns.header')"
              :rules="[
                (val) => !!val || $t('$ezreeport.required'),
                isUniqueRule,
              ]"
              prepend-icon="mdi-rename"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <EditorAggregationForm
              v-model="column.aggregation"
              :type="isBucketNeeded ? 'bucket' : undefined"
              @update:model-value="onAggregationChange($event)"
            >
              <template #text>
                <v-row v-if="column.aggregation && 'raw' in column.aggregation">
                  <v-col>
                    <v-switch
                      v-model="column.metric"
                      :label="
                        $t('$ezreeport.editor.figures.table.columns.metric')
                      "
                      :disabled="hasAlreadyMetric"
                      prepend-icon="mdi-counter"
                      color="primary"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </EditorAggregationForm>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <div>
              <v-label>{{
                $t('$ezreeport.editor.figures.table.columns.styles.halign')
              }}</v-label>
            </div>

            <v-btn-toggle v-model="horizontalAlign" color="primary" mandatory>
              <v-btn
                v-tooltip:top="
                  $t('$ezreeport.editor.figures.table.columns.styles.hleft')
                "
                icon="mdi-format-align-left"
                value="left"
              />

              <v-btn
                v-tooltip:top="
                  $t('$ezreeport.editor.figures.table.columns.styles.hcenter')
                "
                icon="mdi-format-align-center"
                value="center"
              />

              <v-btn
                v-tooltip:top="
                  $t('$ezreeport.editor.figures.table.columns.styles.hright')
                "
                icon="mdi-format-align-right"
                value="right"
              />

              <v-btn
                v-tooltip:top="
                  $t('$ezreeport.editor.figures.table.columns.styles.hjustify')
                "
                icon="mdi-format-align-justify"
                value="justify"
              />
            </v-btn-toggle>
          </v-col>

          <v-col>
            <div>
              <v-label>{{
                $t('$ezreeport.editor.figures.table.columns.styles.valign')
              }}</v-label>
            </div>

            <v-btn-toggle v-model="verticalAlign" color="primary" mandatory>
              <v-btn
                v-tooltip:top="
                  $t('$ezreeport.editor.figures.table.columns.styles.vtop')
                "
                icon="mdi-format-align-top"
                value="top"
              />

              <v-btn
                v-tooltip:top="
                  $t('$ezreeport.editor.figures.table.columns.styles.vmiddle')
                "
                icon="mdi-format-align-middle"
                value="middle"
              />

              <v-btn
                v-tooltip:top="
                  $t('$ezreeport.editor.figures.table.columns.styles.vbottom')
                "
                icon="mdi-format-align-bottom"
                value="bottom"
              />
            </v-btn-toggle>
          </v-col>

          <v-col>
            <div>
              <v-label>{{
                $t('$ezreeport.editor.figures.table.columns.styles.fontStyle')
              }}</v-label>
            </div>

            <v-btn-toggle v-model="fontStyles" color="primary" multiple>
              <v-btn
                v-tooltip:top="
                  $t('$ezreeport.editor.figures.table.columns.styles.bold')
                "
                icon="mdi-format-bold"
                value="bold"
              />

              <v-btn
                v-tooltip:top="
                  $t('$ezreeport.editor.figures.table.columns.styles.italic')
                "
                icon="mdi-format-italic"
                value="italic"
              />
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="$t('$ezreeport.confirm')"
        :append-icon="modelValue ? 'mdi-pencil' : 'mdi-plus'"
        :disabled="!isValid || (isBucketNeeded && !column.aggregation)"
        color="primary"
        @click="emit('update:modelValue', column)"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import {
  aggregationTypes,
  isRawAggregation,
  type FigureAggregation,
} from '~sdk/helpers/aggregations';
import { getTableColumnKey, type TableColumn } from '~sdk/helpers/figures';

type VAlign = Exclude<Required<TableColumn>['styles']['valign'], undefined>;
type HAlign = Exclude<Required<TableColumn>['styles']['halign'], undefined>;
type RawFontStyle = Required<TableColumn>['styles']['fontStyle'];
type FontStyles = Exclude<RawFontStyle, undefined | 'bolditalic' | 'normal'>[];

// Components props
const props = defineProps<{
  /** Column to edit, leave undefined to create a new one */
  modelValue?: TableColumn;
  /** Other headers */
  headers?: Set<string>;
  /** Is the table already have a metric */
  hasAlreadyMetric?: boolean;
}>();

// Components events
const emit = defineEmits<{
  /** Updated label */
  (event: 'update:modelValue', value: TableColumn): void;
}>();

// Util composables
// oxlint-disable-next-line id-length
const { t } = useI18n();

/** Is form valid */
const isValid = ref(false);

/** Column to edit */
const { cloned: column } = useCloned<TableColumn>(
  props.modelValue ?? { header: '', metric: true }
);

/** Validate form on mounted */
useTemplateVForm('formRef');

/** Is a bucket needed */
const isBucketNeeded = computed(
  () => props.hasAlreadyMetric && !props.modelValue?.metric
);
/** Vertical alignment */
const verticalAlign = computed<VAlign>({
  get: () => column.value.styles?.valign ?? 'middle',
  set: (value) => {
    column.value.styles = { ...column.value.styles, valign: value };
  },
});
/** Horizontal alignment */
const horizontalAlign = computed<HAlign>({
  get: () => column.value.styles?.halign ?? 'left',
  set: (value) => {
    column.value.styles = { ...column.value.styles, halign: value };
  },
});
/** Font styles */
const fontStyles = computed<FontStyles>({
  get: () => {
    // No font style means normal
    if (
      !column.value.styles?.fontStyle ||
      column.value.styles.fontStyle === 'normal'
    ) {
      return [];
    }
    // Split bold and italic into two buttons
    if (column.value.styles.fontStyle === 'bolditalic') {
      return ['bold', 'italic'] as FontStyles;
    }
    return [column.value.styles.fontStyle];
  },
  set: (value) => {
    let fontStyle: RawFontStyle;

    const hasBold = value.includes('bold');
    const hasItalic = value.includes('italic');

    if (hasBold && hasItalic) {
      fontStyle = 'bolditalic';
    } else if (hasBold) {
      fontStyle = 'bold';
    } else if (hasItalic) {
      fontStyle = 'italic';
    }

    column.value.styles = { ...column.value.styles, fontStyle };
  },
});

/**
 * Check if the column is unique
 */
function isUniqueRule(val: string) {
  if (props.modelValue && getTableColumnKey(props.modelValue) === val) {
    return true;
  }
  if (props.headers?.has(val)) {
    return t('$ezreeport.duplicate');
  }
  return true;
}

/**
 * Update if column is a metric or not on aggregation change
 */
function onAggregationChange(aggregation: FigureAggregation | undefined) {
  // No aggregation means a "Count", and a "Count" is always a metric
  if (!aggregation) {
    column.value.metric = true;
    return;
  }

  // If it's a raw aggregation, we must let the user choose if it's a metric or not
  if (isRawAggregation(aggregation)) {
    return;
  }

  // If it's a base aggregation, guess if it's a metric or not
  const aggType = aggregationTypes.find((agg) => agg.name === aggregation.type);
  column.value.metric = aggType?.type === 'metric';
}
</script>
