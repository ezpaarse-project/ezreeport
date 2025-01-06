<template>
  <v-data-table-server
    v-model="selectedTemplates"
    :headers="headers"
    show-select
    return-object
    v-bind="vDataTableOptions"
    item-value="id"
  >
    <template #top>
      <v-toolbar
        :title="`${titlePrefix || ''}${$t('$ezreeport.template.title:list', total)}`"
        color="transparent"
        density="comfortable"
      >
        <template v-if="$slots.prepend" #prepend>
          <slot name="prepend" />
        </template>

        <template #append>
          <v-btn
            v-if="availableActions.create"
            v-tooltip:top="$t('$ezreeport.new')"
            variant="tonal"
            color="green"
            icon="mdi-plus"
            density="comfortable"
            class="ml-2"
            @click="openForm()"
          />

          <v-btn
            v-tooltip:top="$t('$ezreeport.refresh')"
            :loading="loading"
            variant="tonal"
            color="primary"
            icon="mdi-refresh"
            density="comfortable"
            class="ml-2"
            @click="refresh"
          />

          <v-text-field
            v-model="filters.query"
            :placeholder="$t('$ezreeport.search')"
            append-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            width="200"
            hide-details
            class="ml-2"
          />
        </template>
      </v-toolbar>
    </template>

    <template #[`item.tags`]="{ value }">
      <TemplateTagView :model-value="value" />
    </template>

    <template #[`item.hidden`]="{ value, item }">
      <v-btn
        v-tooltip="$t('$ezreeport.template.hidden:desc', value ? 1 : 0)"
        :icon="value ? 'mdi-eye-off' : 'mdi-eye'"
        :disabled="!availableActions.visibility"
        variant="plain"
        density="compact"
        @click="toggleItemVisibility(item)"
      />
    </template>

    <template #[`item.updatedAt`]="{ value }">
      <LocalDate v-if="value" :model-value="value" />
    </template>

    <template #[`item.createdAt`]="{ value }">
      <LocalDate :model-value="value" />
    </template>

    <template #[`item._actions`]="{ item }">
      <v-menu>
        <template #activator="{ props: menu }">
          <v-btn
            icon="mdi-cog"
            variant="plain"
            density="compact"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            :title="$t('$ezreeport.duplicate')"
            :disabled="!availableActions.create"
            prepend-icon="mdi-content-copy"
            @click="openDuplicateForm(item)"
          />

          <v-divider />

          <v-list-item
            :title="$t('$ezreeport.edit')"
            :disabled="!availableActions.update"
            prepend-icon="mdi-pencil"
            @click="openForm(item)"
          />

          <v-list-item
            :title="$t('$ezreeport.delete')"
            :disabled="!availableActions.delete || item.id === defaultTemplateId"
            prepend-icon="mdi-delete"
            @click="deleteItem(item)"
          />
        </v-list>
      </v-menu>
    </template>

    <template #no-data>
      <v-empty-state
        :title="$t('$ezreeport.template.noList')"
        :text="$t('$ezreeport.template.noList:desc')"
        icon="mdi-view-grid-outline"
      >
        <template #actions>
          <v-btn
            v-if="availableActions.create"
            :text="$t('$ezreeport.new')"
            color="green"
            append-icon="mdi-plus"
            @click="openForm()"
          />
        </template>
      </v-empty-state>
    </template>
  </v-data-table-server>

  <SelectionMenu
    v-model="selectedTemplateIds"
    :text="$t('$ezreeport.template.manage', selectedTemplates.length)"
  >
    <template #actions>
      <v-list-item
        :title="$t('$ezreeport.delete')"
        prepend-icon="mdi-delete"
        @click="deleteSelected()"
      />

      <v-divider />

      <v-list-item
        v-if="availableActions.visibility"
        :title="$t('$ezreeport.template.hidden:toggle')"
        prepend-icon="mdi-eye-off"
        @click="toggleSelectedVisibility()"
      />
    </template>
  </SelectionMenu>

  <v-dialog
    v-model="isFormOpen"
    width="80%"
    scrollable
    @update:model-value="$event || refresh()"
  >
    <template #default>
      <TemplateForm
        :model-value="updatedTemplate"
        :readonly=" updatedTemplate.id === defaultTemplateId"
        @update:model-value="onSave($event)"
      >

        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeForm()" />
        </template>
      </TemplateForm>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import type { VDataTable } from 'vuetify/components';

import { refreshPermissions, hasPermission } from '~sdk/helpers/permissions';
import {
  changeTemplateVisibility,
  createTemplateHelper,
  createTemplateHelperFrom,
  templateHelperToJSON,
  type TemplateHelper,
} from '~sdk/helpers/templates';
import {
  getAllTemplates,
  getTemplate,
  createTemplate,
  upsertTemplate,
  deleteTemplate,
  type Template,
} from '~sdk/templates';

type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

// Components props
defineProps<{
  titlePrefix?: string;
}>();

// Utils composable
const { t } = useI18n();

const defaultTemplateId = ref('');
const arePermissionsReady = ref(false);
const selectedTemplates = ref<Omit<Template, 'body'>[]>([]);
const updatedTemplate = ref<TemplateHelper>(createTemplateHelper());
const isFormOpen = ref(false);

/** List of templates */
const {
  total,
  refresh,
  loading,
  filters,
  vDataTableOptions,
} = useServerSidePagination(
  async (params) => {
    const res = await getAllTemplates(params);
    defaultTemplateId.value = res.meta.default;
    return res;
  },
  { sortBy: 'name' },
);

/** Headers for table */
const headers = computed((): VDataTableHeaders => [
  {
    title: t('$ezreeport.name'),
    value: 'name',
    sortable: true,
  },
  {
    title: t('$ezreeport.template.tags.title'),
    value: 'tags',
  },
  {
    title: t('$ezreeport.updatedAt'),
    value: 'updatedAt',
    sortable: true,
  },
  {
    title: t('$ezreeport.createdAt'),
    value: 'createdAt',
    sortable: true,
  },
  {
    title: t('$ezreeport.template.hidden'),
    value: 'hidden',
    sortable: true,
    align: 'center',
  },
  {
    title: t('$ezreeport.actions'),
    value: '_actions',
    align: 'center',
  },
]);

const availableActions = computed(() => {
  if (!arePermissionsReady.value) {
    return {};
  }
  return {
    create: hasPermission(createTemplate),
    update: hasPermission(upsertTemplate),
    delete: hasPermission(deleteTemplate),

    visibility: hasPermission(changeTemplateVisibility),
  };
});

const selectedTemplateIds = computed({
  get: () => selectedTemplates.value.map((template) => template.id),
  set: (v) => {
    const ids = new Set(v);
    selectedTemplates.value = selectedTemplates.value.filter((template) => ids.has(template.id));
  },
});

async function openForm(template?: Omit<Template, 'body'>) {
  try {
    if (template) {
      updatedTemplate.value = createTemplateHelperFrom(await getTemplate(template));
    } else {
      updatedTemplate.value = createTemplateHelper();
    }

    isFormOpen.value = true;
  } catch (e) {
    handleEzrError(t('$ezreeport.template.errors.open'), e);
  }
}

async function openDuplicateForm(template: Omit<Template, 'body'>) {
  try {
    const base = await getTemplate(template);

    updatedTemplate.value = createTemplateHelperFrom({
      ...base,
      id: '',
    });

    isFormOpen.value = true;
  } catch (e) {
    handleEzrError(t('$ezreeport.template.errors.open'), e);
  }
}

function closeForm() {
  isFormOpen.value = false;
  refresh();
}

async function deleteItem(template: Omit<Template, 'body'>) {
  // TODO: show warning
  try {
    await deleteTemplate(template);
    refresh();
  } catch (e) {
    handleEzrError(t('$ezreeport.template.errors.delete'), e);
  }
}

async function deleteSelected() {
  // TODO: show warning
  try {
    await Promise.all(selectedTemplates.value.map((template) => deleteTemplate(template)));
    selectedTemplates.value = [];
    refresh();
  } catch (e) {
    handleEzrError(t('$ezreeport.template.errors.delete'), e);
  }
}

async function toggleItemVisibility(template: Omit<Template, 'body'>) {
  try {
    await changeTemplateVisibility(template, !template.hidden);
    refresh();
  } catch (e) {
    handleEzrError(t('$ezreeport.template.errors.edit'), e);
  }
}

async function toggleSelectedVisibility() {
  try {
    await Promise.all(selectedTemplates.value.map(
      (template) => changeTemplateVisibility(template, !template.hidden),
    ));
    selectedTemplates.value = [];
    refresh();
  } catch (e) {
    handleEzrError(t('$ezreeport.template.errors.edit'), e);
  }
}

async function onSave(template: TemplateHelper) {
  try {
    const data = templateHelperToJSON(template);
    if (template.id) {
      await upsertTemplate({ ...data, id: template.id });
    } else {
      const result = await createTemplate(data);
      openForm(result);
    }
  } catch (e) {
    const msg = template.id ? t('$ezreeport.template.errors.edit') : t('$ezreeport.template.errors.create');
    handleEzrError(msg, e);
  }
}

refreshPermissions()
  .then(() => { arePermissionsReady.value = true; });
</script>
