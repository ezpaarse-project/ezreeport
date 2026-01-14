<template>
  <v-card
    :title="
      modelValue?.id
        ? $t('$ezreeport.task-preset.title:edit')
        : $t('$ezreeport.task-preset.title:new')
    "
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
                <TemplateTagView
                  v-if="currentTemplate"
                  :model-value="currentTemplate.tags ?? []"
                />
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
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :readonly="readonly"
              prepend-icon="mdi-rename"
              variant="underlined"
              required
              @update:model-value="hasNameChanged = true"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-select
              v-model="preset.recurrence"
              :label="$t('$ezreeport.task.recurrence')"
              :items="recurrences"
              :readonly="readonly"
              prepend-icon="mdi-calendar-refresh"
              variant="underlined"
              required
              @update:model-value="onRecurrenceChange()"
            />
          </v-col>

          <v-col>
            <TaskNextRunPicker
              v-model:offset="preset.recurrenceOffset"
              :recurrence="preset.recurrence"
              :readonly="readonly"
            />
          </v-col>
        </v-row>

        <v-divider class="mb-2" />

        <v-row>
          <v-col cols="6">
            <IndexSelector
              v-model="fetchOptions.index"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :readonly="readonly"
              required
              @index:valid="refreshMapping($event)"
            />
          </v-col>

          <v-col cols="6">
            <v-combobox
              v-model="fetchOptions.dateField"
              :label="$t('$ezreeport.template.dateField')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :items="dateMapping"
              :readonly="readonly"
              :return-object="false"
              prepend-icon="mdi-calendar-search"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <EditorFilterList v-model="filters" />
          </v-col>
        </v-row>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        v-if="!readonly"
        :text="modelValue?.id ? $t('$ezreeport.save') : $t('$ezreeport.new')"
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
import { RECURRENCES } from '~sdk/helpers/tasks';
import {
  createTaskPreset,
  upsertTaskPreset,
  type InputTaskPreset,
  type TaskPreset,
} from '~sdk/task-presets';

const modelValue = defineModel<TaskPreset | undefined>();

// Components props
defineProps<{
  readonly?: boolean;
}>();

// Utils composables
// oxlint-disable-next-line id-length
const { t } = useI18n();
const { getOptionsFromMapping, refreshMapping } = useTemplateEditor();

/** Is basic form valid */
const isValid = shallowRef(false);
/** Has name manually changed */
const hasNameChanged = shallowRef(false);
/** Is template list loading */
const loadingTemplates = shallowRef(false);
/** Preset to edit */
const { cloned: preset } = useCloned<InputTaskPreset>(
  modelValue.value ?? {
    name: '',
    recurrence: 'MONTHLY',
    recurrenceOffset: {},
    templateId: '',
    hidden: false,
  }
);

/** Validate on mount */
useTemplateVForm('formRef', { immediate: !!modelValue.value?.id });

/** Mapping options for dateField */
const dateMapping = computed(() => getOptionsFromMapping('date'));
/** Fetch Options */
const fetchOptions = computed({
  get: () => preset.value.fetchOptions ?? {},
  set: (val) => {
    preset.value.fetchOptions = val;
  },
});
/** Filters of task */
const filters = computed({
  get: () =>
    new Map((fetchOptions.value.filters ?? []).map((fil) => [fil.name, fil])),
  set: (value) => {
    if (!value) {
      fetchOptions.value.filters = undefined;
      return;
    }

    const values = Array.from(value.values());
    fetchOptions.value.filters = values;
  },
});
/** Templates list */
const templates = computedAsync(async () => {
  let items: Omit<Template, 'body'>[] = [];

  loadingTemplates.value = true;
  try {
    let meta;
    ({ items, meta } = await getAllTemplates({
      pagination: { count: 0, sort: 'name' },
      include: ['tags'],
    }));
    templates.value = items;

    if (!preset.value.templateId) {
      preset.value.templateId = meta.default;
    }
  } catch (err) {
    handleEzrError(t('$ezreeport.templates.errors.fetch'), err);
  }
  loadingTemplates.value = false;

  return items;
}, []);
/** Current template */
const currentTemplate = computed(() =>
  templates.value.find((template) => template.id === preset.value.templateId)
);
/** Recurrence options */
const recurrences = computed(() =>
  RECURRENCES.map((value) => ({
    value,
    title: t(`$ezreeport.task.recurrenceList.${value}`),
  }))
);

function regenerateName(): void {
  if (modelValue.value?.name || hasNameChanged.value) {
    return;
  }
  const recurrence = t(
    `$ezreeport.task.recurrenceList.${preset.value.recurrence}`
  );
  preset.value.name = `${currentTemplate.value?.name} ${recurrence.toLocaleLowerCase()}`;
}

function onRecurrenceChange(): void {
  preset.value.recurrenceOffset = {};
  regenerateName();
}

async function onTemplateChange(id: string): Promise<void> {
  try {
    const template = await getTemplate(id);

    preset.value.fetchOptions = {
      dateField: template.body.dateField,
      index: template.body.index || '',
    };
    regenerateName();
  } catch (err) {
    handleEzrError(t('$ezreeport.templates.errors.open'), err);
  }
}

async function save(): Promise<void> {
  try {
    const body = {
      ...preset.value,
      // Remove readonly properties
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      template: undefined,
    };

    if (modelValue.value?.id) {
      modelValue.value = await upsertTaskPreset({
        ...body,
        id: modelValue.value.id,
      });
    } else {
      modelValue.value = await createTaskPreset(body);
    }
  } catch (err) {
    const msg = modelValue.value?.id
      ? t('$ezreeport.task-preset.errors.edit')
      : t('$ezreeport.task-preset.errors.create');
    handleEzrError(msg, err);
  }
}
</script>
