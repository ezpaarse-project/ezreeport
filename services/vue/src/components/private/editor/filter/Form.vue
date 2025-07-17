<template>
  <v-card
    :title="modelValue ? $t('$ezreeport.editor.filters.title:edit') : $t('$ezreeport.editor.filters.title:new')"
    prepend-icon="mdi-filter-plus"
  >
    <template #append>
      <v-btn
        v-tooltip="$t('$ezreeport.superUserMode')"
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
                :rules="[(val) => !!val || $t('$ezreeport.required')]"
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

          <v-row>
            <v-col cols="8">
              <p class="text-medium-emphasis">
                {{ $t('$ezreeport.editor.filters.hints.type') }}

                <ul class="pl-3">
                  <li>{{ $t('$ezreeport.editor.filters.hints.type:exists') }}</li>
                  <li>{{ $t('$ezreeport.editor.filters.hints.type:is') }}</li>
                  <li>{{ $t('$ezreeport.editor.filters.hints.type:in') }}</li>
                </ul>
              </p>
            </v-col>

            <v-col cols="4">
              <v-checkbox :label="$t('$ezreeport.editor.filters.isNot')" v-model="filter.isNot" />

              <v-text-field
                :model-value="filterType"
                :label="$t('$ezreeport.editor.filters.type')"
                variant="plain"
                prepend-icon="mdi-format-list-bulleted"
                disabled
              />
            </v-col>
          </v-row>
        </template>

        <v-row>
          <v-col>
            <v-text-field
              v-model="filter.name"
              :label="$t('$ezreeport.editor.filters.name')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              prepend-icon="mdi-rename"
              variant="underlined"
              required
              @update:model-value="hasNameChanged = true"
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
  (event: 'update:modelValue', value: TemplateFilter): void,
}>();

// Utils composables
// oxlint-disable-next-line id-length
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
/** Type of the filter */
const filterType = computed(() => {
  if (isRawFilter(filter.value)) {
    return '';
  }
  if (Array.isArray(filter.value.value)) {
    return t('$ezreeport.editor.filters.types.in');
  }
  if (filter.value.value == null) {
    return t('$ezreeport.editor.filters.types.exists');
  }
  return t('$ezreeport.editor.filters.types.is');
});

function generateFilterName(): string {
  // Don't generate name if it's a raw filter
  if (isRawFilter(filter.value)) {
    return '';
  }

  // We need a field to generate a name
  if (!filter.value.field) {
    return '';
  }

  // Ensure values are an array
  let values = filter.value.value ?? '';
  if (!Array.isArray(values)) {
    values = [values];
  }

  // Generate value text
  const valueText = t('$ezreeport.editor.filters.nameTemplate.values', values, values.length - 1);
  const data = { field: filter.value.field, valueText };

  // Generate name
  if (filter.value.value == null) {
    if (filter.value.isNot) {
      return t('$ezreeport.editor.filters.nameTemplate.exists:not', data);
    }
    return t('$ezreeport.editor.filters.nameTemplate.exists', data);
  } if (filter.value.isNot) {
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

  const name = generateFilterName();
  if (name) {
    filter.value.name = name;
  }
}, { deep: true });
</script>
