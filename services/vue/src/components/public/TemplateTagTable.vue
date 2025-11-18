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

    <template #[`item.name`]="{ item }">
      <TemplateTagChip :model-value="item" density="compact" />
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
            :title="$t('$ezreeport.edit')"
            :disabled="!availableActions.update"
            prepend-icon="mdi-pencil"
            @click="openForm(item)"
          />

          <v-list-item
            :title="$t('$ezreeport.delete')"
            :disabled="!availableActions.delete"
            prepend-icon="mdi-delete"
            @click="deleteItem(item)"
          />
        </v-list>
      </v-menu>
    </template>

    <template #no-data>
      <v-empty-state
        :title="$t('$ezreeport.template.tags.noList')"
        :text="$t('$ezreeport.template.tags.noList:desc')"
        icon="mdi-tag-outline"
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
    v-model="selectedTagIds"
    :text="$t('$ezreeport.template.tags.manage', selectedTags.length)"
  >
    <template #actions>
      <v-list-item
        :title="$t('$ezreeport.delete')"
        prepend-icon="mdi-delete"
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

import { refreshPermissions, hasPermission } from '~sdk/helpers/permissions';
import {
  createTemplateTag,
  deleteTemplateTag,
  getAllTemplateTags,
  upsertTemplateTag,
  type InputTemplateTag,
  type TemplateTag,
} from '~sdk/template-tags';

type VDataTableHeaders = Exclude<VDataTable['$props']['headers'], undefined>;

// Components props
const props = defineProps<{
  titlePrefix?: string;
  itemsPerPageOptions?: number[] | { title: string; value: number }[];
}>();

// Utils composable
// oxlint-disable-next-line id-length
const { t } = useI18n();

const selectedTags = ref<TemplateTag[]>([]);
const arePermissionsReady = shallowRef(false);
const updatedTag = ref<TemplateTag | undefined>();
const isFormOpen = shallowRef(false);

/** Items per page */
const itemsPerPage = defineModel<number>('itemsPerPage', { default: 10 });
/** List of tags */
const { total, refresh, loading, filters, vDataTableOptions } =
  useServerSidePagination((params) => getAllTemplateTags(params), {
    sortBy: 'name',
    itemsPerPage,
    itemsPerPageOptions: props.itemsPerPageOptions,
  });

const title = computed(
  () =>
    `${props.titlePrefix || ''}${t('$ezreeport.template.tags.title:list', total.value)}`
);

/** Headers for table */
const headers = computed(
  (): VDataTableHeaders => [
    {
      title: t('$ezreeport.name'),
      value: 'name',
      sortable: true,
    },
    {
      title: t('$ezreeport.actions'),
      value: '_actions',
      align: 'center',
    },
  ]
);

const availableActions = computed(() => {
  if (!arePermissionsReady.value) {
    return {};
  }
  return {
    create: hasPermission(createTemplateTag),
    update: hasPermission(upsertTemplateTag),
    delete: hasPermission(deleteTemplateTag),
  };
});

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
  } catch (err) {
    handleEzrError(t('$ezreeport.template.tags.errors.delete'), err);
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
  } catch (err) {
    handleEzrError(t('$ezreeport.template.tags.errors.delete'), err);
  }
}
async function onSave(tag: TemplateTag | InputTemplateTag): Promise<void> {
  try {
    if ('id' in tag && tag.id) {
      await upsertTemplateTag(tag);
    } else {
      await createTemplateTag(tag);
    }
    closeForm();
  } catch (err) {
    const msg =
      'id' in tag && tag.id
        ? t('$ezreeport.template.tags.errors.edit')
        : t('$ezreeport.template.tags.errors.create');
    handleEzrError(msg, err);
  }
}

// oxlint-disable-next-line promise/catch-or-return, promise/prefer-await-to-then
refreshPermissions().then(() => {
  arePermissionsReady.value = true;
});
</script>
