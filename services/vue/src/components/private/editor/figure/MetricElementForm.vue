<template>
  <v-card
    :title="modelValue ? $t('$ezreeport.editor.figures.metric.elements.title:edit') : $t('$ezreeport.editor.figures.metric.elements.title:new')"
    prepend-icon="mdi-playlist-plus"
  >
    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row>
          <v-col>
            <EditorAggregationForm
              v-model="label.aggregation"
              type="metric"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-select
              v-model="format"
              :items="formatOptions"
              :label="$t('$ezreeport.editor.figures.metric.elements.format')"
              prepend-icon="mdi-format-paint"
              variant="underlined"
            />
          </v-col>

          <v-col v-if="label.format">
            <v-text-field
              v-model="formatParams"
              :label="formatParamLabel"
              :placeholder="formatParamPlaceholder"
              prepend-icon="mdi-code-braces"
              variant="underlined"
              persistent-placeholder
            >
              <template #details v-if="formatParamHintKey">
                <div class="d-flex align-center">
                  <i18n-t :keypath="formatParamHintKey">
                    <template v-if="label.format.type === 'date'" #link>
                      <a
                        href="https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mx-1"
                      >
                        Unicode Technical Standard #35
                      </a>

                      <v-icon icon="mdi-open-in-new" x-small />
                    </template>
                  </i18n-t>
                </div>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-text-field
              v-model="label.text"
              :label="$t('$ezreeport.name')"
              :rules="[
                (v) => !!v || $t('$ezreeport.required'),
                isUniqueRule,
              ]"
              prepend-icon="mdi-rename"
              variant="underlined"
              required
            />
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
        :disabled="!isValid"
        color="primary"
        @click="emit('update:modelValue', label)"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { isRawAggregation } from '~sdk/helpers/aggregations';
import { getMetricLabelKey, type MetricLabel } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** Label to edit, leave undefined to create a new one */
  modelValue?: MetricLabel | undefined,
  /** Other headers */
  headers?: Set<string>,
}>();

// Components events
const emit = defineEmits<{
  /** Updated label */
  (e: 'update:modelValue', value: MetricLabel): void,
}>();

// Util composables
const { t, te } = useI18n();

/** Is form valid */
const isValid = ref(false);

/** Label to edit */
const { cloned: label } = useCloned<MetricLabel>(props.modelValue ?? { text: '' });

/** Validate form on mounted */
useTemplateVForm('formRef');

/** Format */
const format = computed<string>({
  get: () => label.value.format?.type || '',
  set: (value) => {
    if (!value) {
      label.value.format = undefined;
      return;
    }
    label.value.format = { type: value as 'number' | 'date' };
  },
});
/** Format options */
const formatOptions = computed(() => [
  {
    value: '',
    title: t('$ezreeport.editor.figures.metric.elements.formatOptions.none'),
    props: {
      appendIcon: formatIcons.get('text'),
    },
  },
  {
    value: 'date',
    title: t('$ezreeport.editor.figures.metric.elements.formatOptions.date'),
    props: {
      appendIcon: formatIcons.get('date'),
    },
  },
  {
    value: 'number',
    title: t('$ezreeport.editor.figures.metric.elements.formatOptions.number'),
    props: {
      appendIcon: formatIcons.get('number'),
    },
  },
]);
/** Format params */
const formatParams = computed<string>({
  get: () => label.value.format?.params?.[0] || '',
  set: (value) => {
    if (!label.value.format) {
      return;
    }
    if (!value) {
      label.value.format.params = undefined;
      return;
    }
    label.value.format.params = [value];
  },
});
/** Placeholder of format param */
const formatParamPlaceholder = computed(() => {
  switch (label.value.format?.type) {
    case 'date':
      return 'dd/MM/yyyy';
    case 'number':
      return 'fr';

    default:
      return undefined;
  }
});
/** The label of format param */
const formatParamLabel = computed(() => {
  const key = `$ezreeport.editor.figures.metric.elements.formatOptionsLabel.${format.value}`;
  return te(key) ? t(key) : t('$ezreeport.editor.figures.metric.elements.formatOptionsLabel._default');
});
/** The hint of format param */
const formatParamHintKey = computed(() => {
  const key = `$ezreeport.editor.figures.metric.elements.formatOptionsLabel.${format.value}:hint`;
  return te(key) ? key : '';
});

/**
 * Check if the label is unique
 */
function isUniqueRule(v: string) {
  if (props.modelValue && getMetricLabelKey(props.modelValue) === v) {
    return true;
  }
  if (props.headers?.has(v)) {
    return t('$ezreeport.duplicate');
  }
  return true;
}

/**
 * Generate name of the element when aggregation changed
 */
watch(() => label.value, (newLabel, oldLabel) => {
  if (
    (newLabel.aggregation && isRawAggregation(newLabel.aggregation))
    || (oldLabel.aggregation && isRawAggregation(oldLabel.aggregation))
  ) {
    return;
  }

  if (
    oldLabel.aggregation?.type === newLabel.aggregation?.type
    && oldLabel.aggregation?.field === newLabel.aggregation?.field
  ) {
    return;
  }

  // TODO: prevent user provided value to be overwritten
  label.value.text = t('$ezreeport.editor.aggregation.aggregationTemplate', newLabel.aggregation ?? {});
}, { deep: true });
</script>
