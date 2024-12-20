<template>
  <v-card
    :title="$t('$ezreeport.editor.aggregation.title')"
    prepend-icon="mdi-group"
    variant="outlined"
  >
    <template #append>
      <v-btn
        v-if="!readonly"
        v-tooltip="$t('$ezreeport.advanced')"
        :color="isAdvanced ? 'orange' : 'grey'"
        :variant="isAdvanced ? 'flat' : 'text'"
        :disabled="isAdvanced && (!!rawParseError || rawHasChanged)"
        density="comfortable"
        icon="mdi-tools"
        @click="switchMode()"
      />

      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row v-if="isRawAggregation(aggregation)">
          <v-col>
            <v-textarea
              v-model="rawValue"
              :label="$t('$ezreeport.editor.aggregation.raw')"
              :error-messages="rawParseError?.message"
              :readonly="readonly"
              :disabled="disabled"
              prepend-icon="mdi-cursor-text"
              variant="outlined"
              required
              @update:model-value="rawHasChanged = true"
            />
          </v-col>
        </v-row>

        <template v-else>
          <v-row>
            <v-col>
              <v-autocomplete
                v-model="aggregation.type"
                :label="$t('$ezreeport.editor.aggregation.type')"
                :items="typeOptions"
                :readonly="readonly"
                :disabled="disabled"
                prepend-icon="mdi-select-group"
                variant="underlined"
                hide-details
              />
            </v-col>
          </v-row>

          <v-row v-if="aggregation.type">
            <v-col>
              <v-combobox
                v-model="aggregation.field"
                :label="$t('$ezreeport.editor.aggregation.field')"
                :items="fieldOptions"
                :rules="[(v) => !!v || $t('$ezreeport.required')]"
                :readonly="readonly"
                :disabled="disabled"
                :return-object="false"
                prepend-icon="mdi-form-textbox"
                variant="underlined"
                required
              />
            </v-col>
          </v-row>

          <v-row v-if="isMetric === false">
            <v-col>
              <v-text-field
                :model-value="`${aggregation.size ?? 10}`"
                :label="$t('$ezreeport.editor.aggregation.size')"
                :readonly="readonly"
                :disabled="disabled"
                type="number"
                prepend-icon="mdi-image-size-select-small"
                variant="underlined"
                hide-details
                @update:model-value="aggregation.size = Number.parseInt($event)"
              />
            </v-col>
          </v-row>
        </template>

        <slot name="text" />
      </v-form>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { type InnerAggregation, isRawAggregation, isBaseAggregation } from '~/lib/aggregations';
import { type FigureAggregation, type AggregationType, aggregationTypes } from '~sdk/helpers/aggregations';

// Component props
const props = defineProps<{
  /** Aggregation to edit */
  modelValue?: FigureAggregation | undefined,
  /** Should be disabled */
  disabled?: boolean,
  /** Should be readonly */
  readonly?: boolean,
  /** Types of aggregations allowed in options */
  type?: AggregationType,
}>();

// Component events
const emit = defineEmits<{
  /** Aggregation updated */
  (e: 'update:modelValue', value: FigureAggregation | undefined): void,
}>();

// Utils composables
const { t } = useI18n();
const { getOptionsFromMapping } = useTemplateEditor();

/** Is form valid */
const isValid = ref(false);

/** Aggregation to edit */
const { cloned: aggregation } = useCloned<InnerAggregation>(props.modelValue ?? { type: '', field: '' });
/** Backup of the aggregation in the last mode (simple/advanced) */
const { cloned: aggregationBackup, sync: syncBackup } = useCloned(aggregation, { manual: true });

/** Ref to VForm + validate on mount */
const vform = useTemplateVForm('formRef');

/** Value (and other meta) of the raw aggregation in text format */
const {
  value: rawValue,
  hasChanged: rawHasChanged,
  parseError: rawParseError,
  onChange: onChangeRawValue,
} = useJSONRef(() => (isRawAggregation(aggregation.value) ? aggregation.value.raw : undefined));

/** Is the aggregation in advanced mode */
const isAdvanced = computed(() => isRawAggregation(aggregation.value));
/** Is the aggregation a metric one */
const isMetric = computed(() => {
  const current = aggregation.value;
  if (isRawAggregation(current)) {
    return undefined;
  }
  const aggDef = aggregationTypes.find(({ name }) => current.type === name);
  if (!aggDef) {
    return undefined;
  }
  return aggDef.type === 'metric';
});
/** Options for the field, based on current mapping */
const fieldOptions = computed(() => getOptionsFromMapping(undefined, { dateField: true }));
/** Options for the aggregation type */
const typeOptions = computed(() => {
  let types = [...aggregationTypes];
  if (props.type) {
    types = types.filter((type) => type.type === props.type);
  }

  const grouped = Map.groupBy(types, (aggType) => aggType.isCommonlyFound ?? false);
  return Array.from(grouped)
    // Put common in first
    .sort(([a], [b]) => Number(b) - Number(a))
    .flatMap(([isCommonlyFound, value]) => {
      const items: unknown[] = [
        // There's no way to add "headers", "groups" or "children" into a
        // VSelect (and other derivate), so headers are items with custom style
        {
          title: t(`$ezreeport.editor.aggregation.typeGroups.${isCommonlyFound ? 'common' : 'others'}`),
          value: isCommonlyFound,
          props: {
            disabled: true,
          },
        },
      ];

      // Add count metric type
      if (isCommonlyFound && (!props.type || props.type === 'metric')) {
        items.push({
          title: t('$ezreeport.editor.aggregation.types._count'),
          value: '',
          props: {
            style: {
              paddingLeft: '2rem',
            },
          },
        });
      }

      return [
        ...items,
        // Map items
        ...value.map((type) => ({
          title: t(`$ezreeport.editor.aggregation.types.${type.name}`),
          value: type.name,
          props: {
            subtitle: type.name,
            style: {
              paddingLeft: '2rem',
            },
          },
        })),
      ];
    });
});

/**
 * Switch between advanced and simple mode, also restore the backup
 */
function switchMode() {
  let newAggregation;
  if (isAdvanced.value) {
    newAggregation = {
      type: '',
      field: '',
      ...aggregationBackup.value,
      raw: undefined,
    };
  } else {
    newAggregation = {
      raw: {},
      ...aggregationBackup.value,
      type: undefined,
      field: undefined,
    };
  }
  syncBackup();
  aggregation.value = newAggregation as InnerAggregation;
}

/**
 * Update raw aggregation when value changes
 */
onChangeRawValue((value) => {
  if (!isRawAggregation(aggregation.value) || !value) {
    return;
  }

  aggregation.value.raw = value;
});

/**
 * Update modelValue when aggregation changes
 */
watch(aggregation, () => {
  vform.value?.validate();
  // Update modelValue if raw or valid aggregation
  if (isRawAggregation(aggregation.value) || isBaseAggregation(aggregation.value)) {
    emit('update:modelValue', aggregation.value);
    return;
  }
  // Otherwise reset modelValue
  aggregation.value.field = '';
  emit('update:modelValue', undefined);
}, { deep: true });
</script>
