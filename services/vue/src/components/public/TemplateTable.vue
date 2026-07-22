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
      <v-toolbar :title="title" color="transparent" density="comfortable">
        <template v-if="$slots.prepend" #prepend>
          <slot name="prepend" />
        </template>

        <template v-if="$slots.title" #title>
          <slot name="title" :title="title" />
        </template>

        <template #append>
          <v-btn
            v-if="availableActions.create"
            v-tooltip:top="$t('$ezreeport.new')"
            variant="tonal"
            color="green"
            :icon="mdiPlus"
            density="comfortable"
            class="ml-2"
            @click="openForm()"
          />

          <v-btn
            v-tooltip:top="$t('$ezreeport.refresh')"
            :loading="loading"
            variant="tonal"
            color="primary"
            :icon="mdiRefresh"
            density="comfortable"
            class="ml-2"
            @click="refresh"
          />

          <v-text-field
            v-model="filters.query"
            :placeholder="$t('$ezreeport.search')"
            :append-inner-icon="mdiMagnify"
            variant="outlined"
            density="compact"
            width="200"
            hide-details
            class="ml-2"
          />
        </template>
      </v-toolbar>
    </template>

    <template #[`item.locale`]="{ value }">
      <TemplateLocaleFlag
        v-tooltip:left="$t(`$ezreeport.template.locales.${value}`)"
        :modelValue="value"
        size="small"
      />
    </template>

    <template #[`item.tags`]="{ value }">
      <TemplateTagView :model-value="value" />
    </template>

    <template #[`item.hidden`]="{ value, item }">
      <v-btn
        v-tooltip="$t('$ezreeport.template.hidden:desc', value ? 1 : 0)"
        :icon="value ? mdiEyeOff : mdiEye"
        :disabled="!availableActions.visibility"
        variant="plain"
        density="compact"
        @click="toggleItemVisibility(item)"
      />
    </template>

    <template #[`item.updatedAt`]="{ value }">
      <LocalDate v-if="value" :model-value="value" />
    </template>

    <template #[`item._actions`]="{ item }">
      <v-menu>
        <template #activator="{ props: menu }">
          <v-btn
            :icon="mdiCog"
            variant="plain"
            density="compact"
            v-bind="menu"
          />
        </template>

        <v-list>
          <v-list-item
            :title="$t('$ezreeport.duplicate')"
            :disabled="!availableActions.create"
            :prepend-icon="mdiContentCopy"
            @click="openDuplicateForm(item)"
          />

          <v-divider />

          <v-list-item
            :title="$t('$ezreeport.edit')"
            :disabled="!availableActions.update"
            :prepend-icon="mdiPencil"
            @click="openForm(item)"
          />

          <v-list-item
            :title="$t('$ezreeport.delete')"
            :disabled="
              !availableActions.delete || item.id === defaultTemplateId
            "
            :prepend-icon="mdiDelete"
            @click="deleteItem(item)"
          />
        </v-list>
      </v-menu>
    </template>

    <template #no-data>
      <v-empty-state
        :title="$t('$ezreeport.template.noList')"
        :text="$t('$ezreeport.template.noList:desc')"
        :icon="mdiViewGridOutline"
      >
        <template #actions>
          <v-btn
            v-if="availableActions.create"
            :text="$t('$ezreeport.new')"
            color="green"
            :append-icon="mdiPlus"
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
        :prepend-icon="mdiDelete"
        @click="deleteSelected()"
      />

      <v-divider />

      <v-list-item
        v-if="availableActions.visibility"
        :title="$t('$ezreeport.template.hidden:toggle')"
        :prepend-icon="mdiEyeOff"
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
        :readonly="updatedTemplate.id === defaultTemplateId"
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
  import {
    mdiCog,
    mdiContentCopy,
    mdiDelete,
    mdiEye,
    mdiEyeOff,
    mdiMagnify,
    mdiPencil,
    mdiPlus,
    mdiRefresh,
    mdiViewGridOutline,
  } from '@mdi/js';
  import {
    type TemplateHelper,
    changeTemplateVisibility,
    createTemplateHelper,
    createTemplateHelperFrom,
    templateHelperToJSON,
  } from '~sdk/helpers/templates';
  import {
    type Template,
    createTemplate,
    deleteTemplate,
    getAllTemplates,
    getTemplate,
    upsertTemplate,
  } from '~sdk/templates';

  type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

  // Components props
  const props = defineProps<{
    titlePrefix?: string;
    itemsPerPageOptions?: number[] | { title: string; value: number }[];
  }>();

  // Utils composable
  const { t } = useI18n();

  const defaultTemplateId = shallowRef('');
  const selectedTemplates = ref<Omit<Template, 'body'>[]>([]);
  const updatedTemplate = ref<TemplateHelper>(createTemplateHelper());
  const isFormOpen = shallowRef(false);

  const { availableActions } = usePermissions({
    create: [createTemplate],
    delete: [deleteTemplate],
    update: [upsertTemplate],
    visibility: [changeTemplateVisibility],
  });

  /** Items per page */
  const itemsPerPage = defineModel<number>('itemsPerPage', { default: 10 });
  /** List of templates */
  const { total, refresh, loading, filters, vDataTableOptions } =
    useServerSidePagination(
      async (params) => {
        const res = await getAllTemplates(params);
        defaultTemplateId.value = res.meta.default;
        return res;
      },
      {
        include: ['tags'],
        itemsPerPage,
        itemsPerPageOptions: props.itemsPerPageOptions,
        sortBy: 'name',
      }
    );

  const title = computed(
    () =>
      `${props.titlePrefix || ''}${t('$ezreeport.template.title:list', total.value)}`
  );

  /** Headers for table */
  const headers = computed(
    (): VDataTableHeaders => [
      {
        sortable: true,
        title: t('$ezreeport.name'),
        value: 'name',
      },
      {
        align: 'center',
        title: t('$ezreeport.template.locale'),
        value: 'locale',
      },
      {
        title: t('$ezreeport.template.tags.title'),
        value: 'tags',
      },
      {
        sortable: true,
        title: t('$ezreeport.updatedAt'),
        value: 'updatedAt',
      },
      {
        align: 'center',
        sortable: true,
        title: t('$ezreeport.template.hidden'),
        value: 'hidden',
      },
      {
        align: 'center',
        title: t('$ezreeport.actions'),
        value: '_actions',
      },
    ]
  );

  const selectedTemplateIds = computed({
    get: () => selectedTemplates.value.map((template) => template.id),
    set: (value) => {
      const ids = new Set(value);
      selectedTemplates.value = selectedTemplates.value.filter((template) =>
        ids.has(template.id)
      );
    },
  });

  async function openForm(template?: Omit<Template, 'body'>): Promise<void> {
    try {
      if (template) {
        updatedTemplate.value = createTemplateHelperFrom(
          await getTemplate(template, ['tags'])
        );
      } else {
        updatedTemplate.value = createTemplateHelper();
      }

      isFormOpen.value = true;
    } catch (error) {
      handleEzrError(t('$ezreeport.template.errors.open'), error);
    }
  }

  async function openDuplicateForm(
    template: Omit<Template, 'body'>
  ): Promise<void> {
    try {
      updatedTemplate.value = createTemplateHelperFrom({
        ...(await getTemplate(template, ['tags'])),
        id: '',
        name: `${template.name} (copy)`,
      });

      isFormOpen.value = true;
    } catch (error) {
      handleEzrError(t('$ezreeport.template.errors.open'), error);
    }
  }

  function closeForm(): void {
    isFormOpen.value = false;
    refresh();
  }

  async function deleteItem(template: Omit<Template, 'body'>): Promise<void> {
    // TODO: show warning
    try {
      await deleteTemplate(template);
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.template.errors.delete'), error);
    }
  }

  async function deleteSelected(): Promise<void> {
    // TODO: show warning
    try {
      await Promise.all(
        selectedTemplates.value.map((template) => deleteTemplate(template))
      );
      selectedTemplates.value = [];
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.template.errors.delete'), error);
    }
  }

  async function toggleItemVisibility(
    template: Omit<Template, 'body'>
  ): Promise<void> {
    try {
      await changeTemplateVisibility(template, !template.hidden);
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.template.errors.edit'), error);
    }
  }

  async function toggleSelectedVisibility(): Promise<void> {
    try {
      await Promise.all(
        selectedTemplates.value.map((template) =>
          changeTemplateVisibility(template, !template.hidden)
        )
      );
      selectedTemplates.value = [];
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.template.errors.edit'), error);
    }
  }

  async function onSave(template: TemplateHelper): Promise<void> {
    try {
      let result;
      const data = templateHelperToJSON(template);
      if (template.id) {
        result = await upsertTemplate({ ...data, id: template.id });
      } else {
        result = await createTemplate(data);
      }
      openForm(result);
    } catch (error) {
      const msg = template.id
        ? t('$ezreeport.template.errors.edit')
        : t('$ezreeport.template.errors.create');
      handleEzrError(msg, error);
    }
  }
</script>
