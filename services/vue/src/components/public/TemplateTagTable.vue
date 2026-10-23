<template>
  <v-data-table-server
    v-model="selectedTags"
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

    <template #[`item.name`]="{ item }">
      <TemplateTagChip :model-value="item" density="compact" />
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
            :title="$t('$ezreeport.edit')"
            :disabled="!availableActions.update"
            :prepend-icon="mdiPencil"
            @click="openForm(item)"
          />

          <v-list-item
            :title="$t('$ezreeport.delete')"
            :disabled="!availableActions.delete"
            :prepend-icon="mdiDelete"
            @click="deleteItem(item)"
          />
        </v-list>
      </v-menu>
    </template>

    <template #no-data>
      <v-empty-state
        :title="$t('$ezreeport.template.tags.noList')"
        :text="$t('$ezreeport.template.tags.noList:desc')"
        :icon="mdiTagOutline"
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
    v-model="selectedTagIds"
    :text="$t('$ezreeport.template.tags.manage', selectedTags.length)"
  >
    <template #actions>
      <v-list-item
        :title="$t('$ezreeport.delete')"
        :prepend-icon="mdiDelete"
        @click="deleteSelected()"
      />
    </template>
  </SelectionMenu>

  <v-dialog
    v-model="isFormOpen"
    width="50%"
    scrollable
    @update:model-value="$event || refresh()"
  >
    <template #default>
      <TemplateTagForm
        :model-value="updatedTag"
        @update:model-value="onSave($event)"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeForm()" />
        </template>
      </TemplateTagForm>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { VDataTable } from 'vuetify/components';
  import {
    mdiCog,
    mdiDelete,
    mdiMagnify,
    mdiPencil,
    mdiPlus,
    mdiRefresh,
    mdiTagOutline,
  } from '@mdi/js';
  import {
    type InputTemplateTag,
    type TemplateTag,
    createTemplateTag,
    deleteTemplateTag,
    getAllTemplateTags,
    upsertTemplateTag,
  } from '~sdk/template-tags';

  type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

  // Components props
  const props = defineProps<{
    titlePrefix?: string;
    itemsPerPageOptions?: number[] | { title: string; value: number }[];
  }>();

  // Utils composable
  const { t } = useI18n();

  const selectedTags = ref<TemplateTag[]>([]);
  const updatedTag = ref<TemplateTag | undefined>();
  const isFormOpen = shallowRef(false);

  const { availableActions } = usePermissions({
    create: [createTemplateTag],
    delete: [deleteTemplateTag],
    update: [upsertTemplateTag],
  });

  /** Items per page */
  const itemsPerPage = defineModel<number>('itemsPerPage', { default: 10 });
  /** List of tags */
  const { total, refresh, loading, filters, vDataTableOptions } =
    useServerSidePagination((params) => getAllTemplateTags(params), {
      itemsPerPage,
      itemsPerPageOptions: props.itemsPerPageOptions,
      sortBy: 'name',
    });

  const title = computed(
    () =>
      `${props.titlePrefix || ''}${t('$ezreeport.template.tags.title:list', total.value)}`
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
        title: t('$ezreeport.actions'),
        value: '_actions',
      },
    ]
  );

  const selectedTagIds = computed({
    get: () => selectedTags.value.map((template) => template.id),
    set: (value) => {
      const ids = new Set(value);
      selectedTags.value = selectedTags.value.filter((tag) => ids.has(tag.id));
    },
  });

  function openForm(tag?: TemplateTag): void {
    updatedTag.value = tag;
    isFormOpen.value = true;
  }

  function closeForm(): void {
    isFormOpen.value = false;
    refresh();
  }

  async function deleteItem(tag: TemplateTag): Promise<void> {
    // TODO: show warning
    try {
      await deleteTemplateTag(tag);
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.template.tags.errors.delete'), error);
    }
  }

  async function deleteSelected(): Promise<void> {
    // TODO: show warning
    try {
      await Promise.all(
        selectedTagIds.value.map((tag) => deleteTemplateTag(tag))
      );
      selectedTagIds.value = [];
      refresh();
    } catch (error) {
      handleEzrError(t('$ezreeport.template.tags.errors.delete'), error);
    }
  }
  async function onSave(tag: TemplateTag | InputTemplateTag): Promise<void> {
    try {
      // oxlint-disable-next-line unicorn/prefer-ternary
      if ('id' in tag && tag.id) {
        await upsertTemplateTag(tag);
      } else {
        await createTemplateTag(tag);
      }
      closeForm();
    } catch (error) {
      const msg =
        'id' in tag && tag.id
          ? t('$ezreeport.template.tags.errors.edit')
          : t('$ezreeport.template.tags.errors.create');
      handleEzrError(msg, error);
    }
  }
</script>
