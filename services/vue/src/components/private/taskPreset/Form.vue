<template>
  <v-card
    :title="modelValue?.id ? $t('$ezreeport.task-preset.title:edit') : $t('$ezreeport.task-preset.title:new')"
    :prepend-icon="modelValue?.id ? 'mdi-file' : 'mdi-file-plus'"
  >
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row>
          <v-col>
            <v-autocomplete
              v-model="preset.templateId"
              :label="$t('$ezreeport.template.title')"
              :items="templates"
              :readonly="readonly"
              :return-object="false"
              :loading="loadingTemplates"
              item-value="id"
              item-title="name"
              prepend-icon="mdi-view-grid"
              variant="underlined"
              @update:model-value="onTemplateChange($event)"
            >
              <template #append-inner>
                <TemplateTagView v-if="currentTemplate" :model-value="currentTemplate.tags ?? []" />
              </template>

              <template #item="{ item: { raw: item }, props: listItem }">
                <v-list-item :title="item.name" lines="two" v-bind="listItem">
                  <template #subtitle>
                    <TemplateTagView :model-value="item.tags ?? []" />
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-text-field
              v-model="preset.name"
              :label="$t('$ezreeport.name')"
              :rules="[(v) => !!v || $t('$ezreeport.required')]"
              :readonly="readonly"
              prepend-icon="mdi-rename"
              variant="underlined"
              required
              @update:model-value="hasNameChanged = true"
            />
          </v-col>

          <v-col>
            <v-select
              v-model="preset.recurrence"
              :label="$t('$ezreeport.task.recurrence')"
              :items="recurrences"
              :readonly="readonly"
              prepend-icon="mdi-calendar-refresh"
              variant="underlined"
              required
              @update:model-value="regenerateName()"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <IndexSelector
              v-model="preset.fetchOptions.index"
              :rules="[(v) => !!v || $t('$ezreeport.required')]"
              :readonly="readonly"
              required
              @index:valid="refreshMapping($event)"
            />
          </v-col>

          <v-col cols="6">
            <v-combobox
              v-model="preset.fetchOptions.dateField"
              :label="$t('$ezreeport.template.dateField')"
              :rules="[(v) => !!v || $t('$ezreeport.required')]"
              :items="dateMapping"
              :readonly="readonly"
              prepend-icon="mdi-calendar-search"
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
        v-if="!readonly"
        :text="$t('$ezreeport.confirm')"
        :append-icon="modelValue?.id ? 'mdi-pencil' : 'mdi-plus'"
        :disabled="!isValid"
        color="primary"
        @click="save()"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { getAllTemplates, getTemplate, type Template } from '~sdk/templates';
import {
  createTaskPreset,
  upsertTaskPreset,
  type InputTaskPreset,
  type TaskPreset,
} from '~sdk/task-presets';

// Components props
const props = defineProps<{
  modelValue: TaskPreset | undefined;
  readonly?: boolean;
}>();

// Components events
const emit = defineEmits<{
  /** Updated template */
  (e: 'update:modelValue', value: TaskPreset): void
}>();

// Utils composables
const { t } = useI18n();
const { getOptionsFromMapping, refreshMapping } = useTemplateEditor();

/** Is basic form valid */
const isValid = ref(false);
/** Has name manually changed */
const hasNameChanged = ref(false);
/** Preset to edit */
const preset = ref<InputTaskPreset>({
  name: props.modelValue?.name ?? '',
  fetchOptions: props.modelValue?.fetchOptions ?? { dateField: '', index: '' },
  hidden: props.modelValue?.hidden ?? false,
  recurrence: props.modelValue?.recurrence ?? 'MONTHLY',
  templateId: props.modelValue?.templateId ?? '',
});
/** Is template list loading */
const loadingTemplates = ref(false);
/** Templates list */
const templates = ref<Omit<Template, 'body'>[]>([]);

/** Validate on mount */
useTemplateVForm('formRef');

/** Mapping options for dateField */
const dateMapping = computed(() => getOptionsFromMapping('date'));
/** Current template */
const currentTemplate = computed(
  () => templates.value.find((template) => template.id === preset.value.templateId),
);
/** Recurrence options */
const recurrences = computed(
  () => [
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'BIENNIAL',
    'YEARLY',
  ].map((value) => ({ value, title: t(`$ezreeport.task.recurrenceList.${value}`) })),
);

function regenerateName() {
  if (props.modelValue?.name || hasNameChanged.value) {
    return;
  }
  const recurrence = t(`$ezreeport.task.recurrenceList.${preset.value.recurrence}`);
  preset.value.name = `${currentTemplate.value?.name} ${recurrence.toLocaleLowerCase()}`;
}

async function fetchTemplates() {
  loadingTemplates.value = true;
  try {
    const { items, meta } = await getAllTemplates({ pagination: { count: 0, sort: 'name' } });
    templates.value = items;

    if (!preset.value.templateId) {
      preset.value.templateId = meta.default;
    }
  } catch (e) {
    handleEzrError(t('$ezreeport.templates.errors.fetch'), e);
  }
  loadingTemplates.value = false;
}

async function onTemplateChange(id: string) {
  try {
    const template = await getTemplate(id);

    preset.value = {
      ...preset.value,
      fetchOptions: {
        dateField: template.body.dateField,
        index: template.body.index || '',
      },
    };
    regenerateName();
  } catch (e) {
    handleEzrError(t('$ezreeport.templates.errors.open'), e);
  }
}

async function save() {
  try {
    let result;
    if (props.modelValue?.id) {
      result = await upsertTaskPreset({
        ...preset.value,
        id: props.modelValue.id,
      });
    } else {
      result = await createTaskPreset(preset.value);
    }

    emit('update:modelValue', result);
  } catch (e) {
    const msg = props.modelValue?.id ? t('$ezreeport.task-preset.errors.edit') : t('$ezreeport.task-preset.errors.create');
    handleEzrError(msg, e);
  }
}

fetchTemplates();
</script>
