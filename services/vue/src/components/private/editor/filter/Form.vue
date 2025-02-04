<template>
  <v-card
    :title="modelValue ? $t('$ezreeport.editor.filters.title:edit') : $t('$ezreeport.editor.filters.title:new')"
    prepend-icon="mdi-filter-plus"
  >
    <template #append>
      <v-btn
        v-tooltip="$t('$ezreeport.advanced')"
        :color="isAdvanced ? 'orange' : 'grey'"
        :disabled="isAdvanced && (!!rawParseError || rawHasChanged)"
        density="comfortable"
        icon="mdi-tools"
        variant="text"
        @click="switchMode()"
      />

      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row v-if="isRawFilter(filter)">
          <v-col>
            <v-textarea
              v-model="rawValue"
              :label="$t('$ezreeport.editor.filters.raw')"
              :error-messages="rawParseError?.message"
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
              <v-combobox
                v-model="filter.field"
                :label="$t('$ezreeport.editor.filters.field')"
                :items="mapping"
                :rules="[(v) => !!v || $t('$ezreeport.required')]"
                :return-object="false"
                prepend-icon="mdi-form-textbox"
                variant="underlined"
                required
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <MultiTextField
                v-model="filter.value"
                :label="$t('$ezreeport.editor.filters.value')"
                prepend-icon="mdi-cursor-text"
                variant="underlined"
              />
            </v-col>
          </v-row>
        </template>

        <v-row>
          <v-col cols="8">
            <v-text-field
              v-model="filter.name"
              :label="$t('$ezreeport.name')"
              :rules="[(v) => !!v || $t('$ezreeport.required')]"
              prepend-icon="mdi-rename"
              variant="underlined"
              required
              @update:model-value="hasNameChanged = true"
            />
          </v-col>

          <v-col cols="4">
            <v-checkbox :label="$t('$ezreeport.editor.filters.isNot')" v-model="filter.isNot" />
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
        :loading="rawHasChanged"
        color="primary"
        @click="$emit('update:modelValue', filter)"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { isRawFilter, type TemplateFilter } from '~sdk/helpers/filters';

// Component props
const props = defineProps<{
  /** Filter to edit, leave undefined to create a new one */
  modelValue?: TemplateFilter | undefined,
}>();

// Component events
defineEmits<{
  /** Filter created or updated */
  (e: 'update:modelValue', value: TemplateFilter): void,
}>();

// Utils composables
const { t } = useI18n();
const { getOptionsFromMapping } = useTemplateEditor();

/** Is form valid */
const isValid = ref(false);
/** Has name manually changed */
const hasNameChanged = ref(false);

/** Filter to edit */
const { cloned: filter } = useCloned<TemplateFilter>(props.modelValue ?? { name: '', field: '' });
/** Backup of the filter in the last mode (simple/advanced) */
const { cloned: filterBackup, sync: syncBackup } = useCloned(filter.value, { manual: true });

/** Validate on mount */
useTemplateVForm('formRef');

/** Value (and other meta) of the raw filter in text format */
const {
  value: rawValue,
  hasChanged: rawHasChanged,
  parseError: rawParseError,
  onChange: onChangeRawValue,
} = useJSONRef(() => (isRawFilter(filter.value) ? filter.value.raw : undefined));

/** Is the filter in advanced mode */
const isAdvanced = computed(() => isRawFilter(filter.value));
/** Mapping options for the simple filter */
const mapping = computed(() => getOptionsFromMapping());

function generateFilterName(filterRef: MaybeRefOrGetter<TemplateFilter>): string {
  const f = toValue(filterRef);

  // Don't generate name if it's a raw filter
  if (isRawFilter(f)) {
    return '';
  }

  // We need a field to generate a name
  if (!f.field) {
    return '';
  }

  // Ensure values are an array
  let values = f.value ?? '';
  if (!Array.isArray(values)) {
    values = [values];
  }

  // Generate value text
  const valueText = t('$ezreeport.editor.filters.nameTemplate.values', values);
  const data = { field: f.field, valueText };

  // Generate name
  if (!f.value) {
    if (f.isNot) {
      return t('$ezreeport.editor.filters.nameTemplate.exists:not', data);
    }
    return t('$ezreeport.editor.filters.nameTemplate.exists', data);
  } if (f.isNot) {
    return t('$ezreeport.editor.filters.nameTemplate.is:not', data);
  }
  return t('$ezreeport.editor.filters.nameTemplate.is', data);
}

/**
 * Switch between advanced and simple mode, also restore the backup
 */
function switchMode() {
  let newFilter;
  if (isAdvanced.value) {
    newFilter = {
      value: '',
      field: '',
      ...filterBackup.value,
      raw: undefined,
    };
  } else {
    newFilter = {
      raw: {},
      ...filterBackup.value,
      value: undefined,
      field: undefined,
    };
  }
  syncBackup();
  filter.value = newFilter;
}

/**
 * Update raw filter when value changes
 */
onChangeRawValue((value) => {
  if (!isRawFilter(filter.value) || !value) {
    return;
  }

  filter.value.raw = value;
});

/**
 * Generate name when filter changes
 */
watch(filter.value, () => {
  if (props.modelValue?.name || hasNameChanged.value) {
    return;
  }

  const name = generateFilterName(filter.value);
  if (name) {
    filter.value.name = name;
  }
}, { deep: true });
</script>
