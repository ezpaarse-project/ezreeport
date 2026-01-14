<template>
  <v-card
    :title="
      isEditing
        ? $t('$ezreeport.task.title:edit')
        : $t('$ezreeport.task.title:new')
    "
    :prepend-icon="isEditing ? 'mdi-email' : 'mdi-email-plus'"
  >
    <template #append>
      <v-alert
        :title="$t('$ezreeport.superUserMode')"
        icon="mdi-tools"
        type="warning"
        variant="tonal"
        density="compact"
      />

      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isFormValid">
        <v-row>
          <v-col>
            <v-autocomplete
              v-model="extendedId"
              :label="$t('$ezreeport.task.extended')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :items="templates"
              :return-object="false"
              :loading="loadingTemplates"
              item-value="id"
              item-title="name"
              prepend-icon="mdi-view-grid"
              variant="underlined"
              required
            >
              <template v-if="extendedTemplate" #append-inner>
                <TemplateTagView
                  :model-value="Array.from(extendedTemplate.tags.values())"
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

        <v-row v-if="!isNamespaced && !isEditing">
          <v-col>
            <v-autocomplete
              v-model="taskNamespaceId"
              :label="$t('$ezreeport.namespace')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :items="namespaces"
              :return-object="false"
              :loading="loadingNamespaces"
              item-value="id"
              item-title="name"
              prepend-icon="mdi-folder"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>
        <v-row v-if="!isNamespaced && isEditing">
          <v-col>
            <v-text-field
              :model-value="namespace?.name || taskNamespaceId"
              :label="$t('$ezreeport.namespace')"
              prepend-icon="mdi-folder"
              variant="plain"
              readonly
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-select
              v-model="recurrence"
              :label="$t('$ezreeport.task.recurrence')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :items="recurrenceOptions"
              :readonly="readonly"
              :return-object="false"
              prepend-icon="mdi-calendar-refresh"
              variant="underlined"
              required
            />
          </v-col>

          <v-col>
            <TaskNextRunPicker
              v-model="nextRun"
              v-model:offset="recurrenceOffset"
              :recurrence="recurrence"
              :readonly="readonly"
              :rules="[
                (val) =>
                  (val && val > new Date()) ||
                  $t('$ezreeport.errors.futureDate'),
              ]"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-text-field
              v-model="name"
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
            <MultiTextField
              v-model="targets"
              :label="$t('$ezreeport.task.targets')"
              :add-label="$t('$ezreeport.task.targets:add')"
              :rules="[(val) => val.length > 0 || $t('$ezreeport.required')]"
              :item-rules="[
                (val, i) =>
                  isEmail(val) || $t('$ezreeport.errors.invalidEmail', i + 1),
              ]"
              :item-placeholder="$t('$ezreeport.task.targets:hint')"
              prepend-icon="mdi-mailbox"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-textarea
              v-model="description"
              :label="$t('$ezreeport.task.description')"
              prepend-icon="mdi-text"
              variant="underlined"
            />
          </v-col>
        </v-row>

        <v-divider class="mb-2" />

        <v-row :class="{ 'd-none': !extendedTemplate }">
          <v-col>
            <IndexSelector
              v-model="index"
              :readonly="readonly"
              :namespace-id="namespaceId || taskNamespaceId"
              @index:valid="
                {
                  hasIndexChanged = true;
                  refreshMapping($event);
                }
              "
            />
          </v-col>

          <v-col cols="6">
            <v-combobox
              v-model="dateField"
              :label="$t('$ezreeport.template.dateField')"
              :items="dateMapping"
              :rules="[
                (val) =>
                  !!val ||
                  !!extendedTemplate?.body.dateField ||
                  $t('$ezreeport.required'),
              ]"
              :return-object="false"
              :placeholder="extendedTemplate?.body.dateField"
              :persistent-placeholder="!!extendedTemplate?.body.dateField"
              :readonly="readonly"
              prepend-icon="mdi-calendar-search"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>
      </v-form>

      <template v-if="extendedTemplate">
        <v-row>
          <v-col>
            <EditorFilterList
              :model-value="modelValue.template.filters"
              :readonly="readonly"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card
              :title="$t('$ezreeport.template.layouts', mergedLayouts.length)"
              :loading="loadingCurrentTemplate && 'primary'"
              prepend-icon="mdi-grid"
              variant="outlined"
            >
              <template #append>
                <v-btn
                  v-tooltip:top="$t('$ezreeport.template.editor:open')"
                  :disabled="!isValid"
                  icon="mdi-arrow-expand"
                  color="primary"
                  density="compact"
                  variant="text"
                  @click="openEditor()"
                />
              </template>

              <template #text>
                <v-row v-if="mergedLayouts.length > 0">
                  <v-col
                    v-for="(layout, index) in mergedLayouts"
                    :key="layout.id"
                    cols="12"
                    sm="4"
                    md="2"
                  >
                    <EditorPreviewLayout
                      :model-value="layout"
                      @click="openEditor(index)"
                    >
                      <template #prepend>
                        <span>{{ index + 1 }}</span>
                        <v-icon
                          v-if="layout.readonly"
                          icon="mdi-lock"
                          size="x-small"
                        />
                      </template>
                    </EditorPreviewLayout>
                  </v-col>
                </v-row>

                <v-row v-else>
                  <v-col>
                    <v-empty-state
                      :title="$t('$ezreeport.template.noTemplate')"
                      :text="$t('$ezreeport.template.noTemplate:desc')"
                      icon="mdi-grid-off"
                    >
                      <template #actions>
                        <v-btn
                          :text="$t('$ezreeport.template.editor:open')"
                          :disabled="!isValid"
                          color="primary"
                          append-icon="mdi-arrow-expand"
                          @click="openEditor()"
                        />
                      </template>
                    </v-empty-state>
                  </v-col>
                </v-row>
              </template>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        v-if="!readonly"
        :text="isEditing ? $t('$ezreeport.save') : $t('$ezreeport.new')"
        :append-icon="isEditing ? 'mdi-content-save' : 'mdi-plus'"
        :disabled="!isValid || !hasChanged"
        color="primary"
        @click="modelValue = modelValue"
      />
    </template>

    <v-dialog
      v-if="extendedTemplate"
      v-model="isEditorVisible"
      :disabled="!isValid"
      transition="slide-x-reverse-transition"
      fullscreen
      scrollable
    >
      <EditorTask
        v-model:index="selectedIndex"
        :model-value="modelValue.template"
        :extends="extendedTemplate.body"
        :readonly="readonly"
      >
        <template #append>
          <v-btn
            icon="mdi-close"
            variant="text"
            density="comfortable"
            @click="closeEditor()"
          />
        </template>

        <template #actions>
          <v-btn
            v-if="readonly"
            :text="$t('$ezreeport.close')"
            append-icon="mdi-close"
            @click="closeEditor()"
          />
          <v-btn
            v-else
            :text="$t('$ezreeport.confirm')"
            append-icon="mdi-check"
            color="primary"
            @click="closeEditor()"
          />
        </template>
      </EditorTask>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { isEmail } from '~/utils/validate';
import type { Namespace } from '~sdk/namespaces';
import { getAllTemplates, getTemplate, type Template } from '~sdk/templates';
import {
  RECURRENCES,
  getLayoutsOfHelpers,
  hasTaskChanged,
  type TaskHelper,
} from '~sdk/helpers/tasks';
import { createTemplateHelperFrom } from '~sdk/helpers/templates';
import { getCurrentNamespaces } from '~sdk/auth';

const modelValue = defineModel<TaskHelper>({ required: true });

// Components props
const { namespaceId } = defineProps<{
  /** Namespace to create/edit task in */
  namespaceId?: string;
  /** Should be readonly */
  readonly?: boolean;
}>();

// Utils composables
// oxlint-disable-next-line id-length
const { t } = useI18n();
const { getOptionsFromMapping, refreshMapping, updateDateField } =
  useTemplateEditor({
    // grid: modelValue.value.template.grid,
    index: modelValue.value.template.index,
    dateField: modelValue.value.template.dateField,
    namespaceId,
  });

/** Selected index */
const selectedIndex = shallowRef(0);
/** Is task already exists */
const isEditing = shallowRef(!!modelValue.value.id);
/** Has name manually changed */
const hasNameChanged = shallowRef(!!modelValue.value.name);
/** Has index manually changed */
const hasIndexChanged = shallowRef(!!modelValue.value.template.index);
/** Is basic form valid */
const isFormValid = shallowRef(false);
/** Is editor visible */
const isEditorVisible = shallowRef(false);
/** Is namespace list loading */
const loadingNamespaces = shallowRef(false);
/** Is template list loading */
const loadingTemplates = shallowRef(false);
/** Is selected template loading */
const loadingCurrentTemplate = shallowRef(false);

/** Validate on mount */
useTemplateVForm('formRef', { immediate: isEditing.value });

/** Is valid */
const isValid = computed(() => isFormValid.value);
/** Mapping options for dateField */
const dateMapping = computed(() => getOptionsFromMapping('date'));
/** Has template changed since form is opened */
const hasChanged = computed(
  () => !modelValue.value.id || hasTaskChanged(modelValue.value)
);
/** Name of the template */
const name = computed({
  get: () => modelValue.value.name,
  set: (value) => {
    const params = modelValue.value;
    params.name = value;
  },
});
/** Index of the template */
const index = computed({
  get: () => modelValue.value.template.index,
  set: (value) => {
    const { template } = modelValue.value;
    template.index = value;
  },
});
/** DateField of the template */
const dateField = computed({
  get: () => modelValue.value.template.dateField,
  set: (value) => {
    const { template } = modelValue.value;
    updateDateField(value || '');
    template.dateField = value;
  },
});
/** Namespace id of the task */
const taskNamespaceId = computed({
  get: () => modelValue.value.namespaceId,
  set: (value) => {
    const params = modelValue.value;
    params.namespaceId = value;
  },
});
/** Task recurrence */
const recurrence = computed({
  get: () => modelValue.value.recurrence,
  set: (value) => {
    const params = modelValue.value;
    params.recurrence = value;
  },
});
/** Task recurrence offset */
const recurrenceOffset = computed({
  get: () => modelValue.value.recurrenceOffset,
  set: (value) => {
    const params = modelValue.value;
    params.recurrenceOffset = value;
  },
});
/** Task targets */
const targets = computed({
  get: () => modelValue.value.targets,
  set: (value) => {
    const params = modelValue.value;

    if (value == null) {
      params.targets = [];
    }

    let all = value;
    if (!Array.isArray(all)) {
      all = [all];
    }

    // Allow multiple mail addresses, separated by semicolon or comma
    params.targets = Array.from(
      new Set(
        all
          .join(';')
          .replaceAll(/[,]/g, ';')
          .split(';')
          .map((mail) => mail.trim())
      )
    );
  },
});
/** Task description */
const description = computed({
  get: () => modelValue.value.description,
  set: (value) => {
    const params = modelValue.value;
    params.description = value;
  },
});
/** Task next iteration */
const nextRun = computed({
  get: () => modelValue.value.nextRun,
  set: (value) => {
    const params = modelValue.value;
    params.nextRun = value;
  },
});
/** Extended id */
const extendedId = computed({
  get: () => modelValue.value.extendedId,
  set: (value) => {
    const params = modelValue.value;
    params.extendedId = value;
  },
});
/** Extended template */
const extendedTemplate = computedAsync(async () => {
  let template;

  if (!extendedId.value) {
    return template;
  }

  loadingCurrentTemplate.value = true;
  try {
    const res = await getTemplate(extendedId.value);
    template = createTemplateHelperFrom(res);
  } catch (err) {
    handleEzrError(t('$ezreeport.template.errors.open'), err);
  }
  loadingCurrentTemplate.value = false;

  return template;
});
/** Layouts merged with extended template */
const mergedLayouts = computed(() => {
  if (!extendedTemplate.value) {
    return [];
  }

  return getLayoutsOfHelpers(
    modelValue.value.template,
    extendedTemplate.value.body
  );
});
/** Recurrence options */
const recurrenceOptions = computed(() =>
  RECURRENCES.map((value) => ({
    value,
    title: t(`$ezreeport.task.recurrenceList.${value}`),
  }))
);
/** Template list */
const templates = computedAsync(async () => {
  let items: Omit<Template, 'body'>[] = [];

  loadingTemplates.value = true;
  try {
    let meta;
    ({ items, meta } = await getAllTemplates({
      pagination: { count: 0, sort: 'name' },
      include: ['tags'],
    }));
    if (!extendedId.value) {
      extendedId.value = meta.default;
    }
  } catch (err) {
    handleEzrError(t('$ezreeport.template.errors.fetch'), err);
  }
  loadingTemplates.value = false;

  return items;
}, []);
/** Is form namespaced */
const isNamespaced = computed(() => !!namespaceId);
/** Namespace list */
const namespaces = computedAsync(async () => {
  let items: Omit<Namespace, 'fetchLogin' | 'fetchOptions'>[] = [];

  if (isNamespaced.value) {
    return items;
  }

  loadingNamespaces.value = true;
  try {
    const currentNamespaces = await getCurrentNamespaces();
    items = currentNamespaces.toSorted((namespaceA, namespaceB) =>
      namespaceA.name.localeCompare(namespaceB.name)
    );
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.fetchNamespaces'), err);
  }
  loadingNamespaces.value = false;

  return items;
}, []);
/** Current namespace */
const namespace = computed(() =>
  namespaces.value.find((nsp) => nsp.id === taskNamespaceId.value)
);

function regenerateName(): void {
  if (hasNameChanged.value || !extendedTemplate.value) {
    return;
  }
  const rec = t(`$ezreeport.task.recurrenceList.${recurrence.value}`);
  name.value = `${extendedTemplate.value.name} ${rec.toLocaleLowerCase()}`;
}

function applyIndexFromTemplate(): void {
  if (hasIndexChanged.value || !extendedTemplate.value) {
    return;
  }
  index.value = extendedTemplate.value.body.index || '';
}

function openEditor(layoutIndex = 0): void {
  if (!isValid.value) {
    return;
  }

  selectedIndex.value = layoutIndex;
  isEditorVisible.value = true;
}

function closeEditor(): void {
  isEditorVisible.value = false;
}

watch(extendedTemplate, () => applyIndexFromTemplate);
watch([extendedTemplate, recurrence], () => regenerateName());
</script>
