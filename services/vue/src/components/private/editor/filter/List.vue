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
        <v-slide-group-item
          v-for="[, filter] in modelValue"
          :key="filter.name"
        >
          <EditorFilterChip
            :model-value="filter"
            :closable="!readonly"
            class="mr-2"
            @click="openFilterForm(filter)"
            @click:close="deleteFilter(filter)"
          />
        </v-slide-group-item>
      </v-slide-group>
    </template>

    <template v-else #text>
      <span class="text-disabled">{{ $t('$ezreeport.editor.filters.empty') }}</span>
    </template>

    <v-menu
      v-if="!readonly"
      :model-value="isFormVisible"
      :close-on-content-click="false"
      target="parent"
      @update:model-value="$event || closeFilterForm()"
    >
      <EditorFilterForm
        :model-value="updatedFilter"
        width="75%"
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

// Components props
const props = defineProps<{
  /** The filters */
  modelValue: TemplateFilterMap,
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated filters */
  (e: 'update:modelValue', value: TemplateFilterMap): void,
}>();

/** Should show the filter form */
const isFormVisible = ref(false);
/** The filter to edit */
const isImporterVisible = ref(false);
/** The filter to edit */
const updatedFilter = ref<TemplateFilter | undefined>();

/**
 * Close the filter form
 */
function closeFilterForm() {
  isFormVisible.value = false;
}

/**
 * Open the filter form
 *
 * @param filter The filter to edit
 */
function openFilterForm(filter?: TemplateFilter) {
  updatedFilter.value = filter;
  isFormVisible.value = true;
}

/**
 * Upsert the filter
 *
 * @param filter The filter to set
 */
function setFilter(filter: TemplateFilter) {
  props.modelValue.set(filter.name, filter);
  closeFilterForm();
  updatedFilter.value = undefined;
  emit('update:modelValue', props.modelValue);
}

/**
 * Replace all filters
 *
 * @param filters The filters
 */
function replaceFilters(filters: TemplateFilter[]) {
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
 * @param filter The filter
 */
function deleteFilter(filter: TemplateFilter) {
  props.modelValue.delete(filter.name);
  emit('update:modelValue', props.modelValue);
}
</script>
