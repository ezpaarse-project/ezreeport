<template>
  <v-card
    :title="$t('$ezreeport.editor.filters.title', modelValue?.size ?? 0)"
    prepend-icon="mdi-filter"
    variant="outlined"
  >
    <template v-if="!readonly" #append>
      <v-menu v-model="isImporterVisible" :close-on-content-click="false">
        <template #activator="{ props: menu }">
          <v-btn
            v-tooltip:top="$t('$ezreeport.editor.filters.title:import')"
            icon="mdi-import"
            color="primary"
            density="compact"
            variant="text"
            class="ml-2"
            v-bind="menu"
          />
        </template>

        <EditorFilterImporter @update:model-value="replaceFilters($event)" />
      </v-menu>

      <v-btn
        v-tooltip:top="$t('$ezreeport.new')"
        icon="mdi-plus"
        color="green"
        density="compact"
        variant="text"
        class="ml-2"
        @click="openFilterForm()"
      />
    </template>

    <template v-if="modelValue.size > 0" #text>
      <v-slide-group>
        <v-slide-group-item v-for="[key, filter] in modelValue" :key="key">
          <EditorFilterChip
            :model-value="filter"
            :closable="!readonly"
            class="mr-2"
            @click="openFilterForm({ key, filter })"
            @click:close="deleteFilter(key)"
          />
        </v-slide-group-item>
      </v-slide-group>
    </template>

    <template v-else #text>
      <span class="text-disabled">
        {{ $t('$ezreeport.editor.filters.empty') }}
      </span>
    </template>

    <v-menu
      v-if="!readonly"
      :model-value="isFormVisible"
      :close-on-content-click="false"
      target="parent"
      min-width="500"
      max-width="750"
      persistent
      @update:model-value="$event || closeFilterForm()"
    >
      <EditorFilterForm
        :model-value="updatedFilter?.filter"
        @update:model-value="setFilter($event)"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeFilterForm()" />
        </template>
      </EditorFilterForm>
    </v-menu>
  </v-card>
</template>

<script setup lang="ts">
import type { TemplateFilterMap, TemplateFilter } from '~sdk/helpers/filters';

type FilterWithKey = { key: string; filter: TemplateFilter };

// Components props
const props = defineProps<{
  /** The filters */
  modelValue: TemplateFilterMap;
  /** Should be readonly */
  readonly?: boolean;
}>();

// Components events
const emit = defineEmits<{
  /** Updated filters */
  (event: 'update:modelValue', value: TemplateFilterMap): void;
}>();

/** Should show the filter form */
const isFormVisible = ref(false);
/** The filter to edit */
const isImporterVisible = ref(false);
/** The filter to edit */
const updatedFilter = ref<FilterWithKey | undefined>();

/**
 * Close the filter form
 */
function closeFilterForm(): void {
  isFormVisible.value = false;
}

/**
 * Open the filter form
 *
 * @param filter The filter to edit
 */
function openFilterForm(filter?: FilterWithKey): void {
  updatedFilter.value = filter;
  isFormVisible.value = true;
}

/**
 * Upsert the filter
 *
 * @param filter The filter to set
 */
function setFilter(filter: TemplateFilter): void {
  props.modelValue.set(updatedFilter.value?.key ?? filter.name, filter);
  closeFilterForm();
  updatedFilter.value = undefined;
  emit('update:modelValue', props.modelValue);
}

/**
 * Replace all filters
 *
 * @param filters The filters
 */
function replaceFilters(filters: TemplateFilter[]): void {
  props.modelValue.clear();
  for (const filter of filters) {
    props.modelValue.set(filter.name, filter);
  }
  isImporterVisible.value = false;
  emit('update:modelValue', props.modelValue);
}

/**
 * Delete a filter
 *
 * @param key The filter's key
 */
function deleteFilter(key: string): void {
  props.modelValue.delete(key);
  emit('update:modelValue', props.modelValue);
}
</script>
