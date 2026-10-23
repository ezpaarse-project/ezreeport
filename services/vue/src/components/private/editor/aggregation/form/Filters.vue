<template>
  <v-row>
    <v-col cols="12">
      <EditorAggregationTypeAutocomplete
        v-model="currentType"
        :disabled="disabled"
        :readonly="readonly"
        :allowed-type="allowedType"
      />
    </v-col>

    <v-col cols="12">
      <v-list density="compact" lines="two">
        <v-list-subheader class="d-flex align-center">
          {{ $t('$ezreeport.editor.aggregation.filters.title') }}

          <v-btn
            v-tooltip:top="$t('$ezreeport.new')"
            :icon="mdiPlus"
            color="green"
            density="compact"
            variant="text"
            class="ml-2"
            @click="openForm()"
          />
        </v-list-subheader>

        <v-list-item
          v-for="[id, entry] in currentEntries"
          :key="id"
          :title="entry.label"
          :subtitle="
            $t(
              '$ezreeport.editor.aggregation.filters.element.filters',
              entry.filters.length
            )
          "
          :prepend-icon="mdiFormatListBulletedSquare"
          @click="openForm({ id, entry })"
        >
          <template v-if="!readonly" #append>
            <v-btn
              v-tooltip:top="$t('$ezreeport.edit')"
              :icon="mdiPencil"
              color="blue"
              variant="text"
              density="comfortable"
              class="mr-2 ml-8"
            />

            <v-btn
              v-tooltip:top="$t('$ezreeport.delete')"
              :icon="mdiDelete"
              color="red"
              variant="text"
              density="comfortable"
              class="mr-2"
              @click.stop="currentEntries.delete(id)"
            />
          </template>
        </v-list-item>
      </v-list>

      <v-menu
        v-if="!readonly"
        v-model="showForm"
        :close-on-content-click="false"
        target="parent"
      >
        <v-card
          :title="
            editedItem?.id
              ? $t('$ezreeport.editor.aggregation.filters.title:edit')
              : $t('$ezreeport.editor.aggregation.filters.title:new')
          "
          :prepend-icon="mdiFormatListBulletedSquare"
        >
          <template #text>
            <v-form v-model="isValid">
              <v-row>
                <v-col v-if="editedItem" cols="12">
                  <v-text-field
                    v-model="editedItem.entry.label"
                    :label="
                      $t('$ezreeport.editor.aggregation.filters.element.label')
                    "
                    :disabled="disabled"
                    :rules="[(val) => !!val || t('$ezreeport.required')]"
                    :prepend-icon="mdiRename"
                    variant="underlined"
                    hide-details
                  />
                </v-col>

                <v-col v-if="editedItemFilters" cols="12">
                  <EditorFilterList v-model="editedItemFilters" />
                </v-col>
              </v-row>
            </v-form>
          </template>

          <template #actions>
            <v-spacer />

            <v-btn :text="$t('$ezreeport.cancel')" @click="showForm = false" />

            <v-btn
              :text="
                editedItem?.id ? $t('$ezreeport.edit') : $t('$ezreeport.new')
              "
              :disabled="!isValid || (editedItemFilters?.size ?? 0) < 1"
              :append-icon="mdiPencil"
              color="primary"
              @click="upsertEditedEntry()"
            />
          </template>
        </v-card>
      </v-menu>
    </v-col>

    <v-col cols="6">
      <v-switch
        v-model="showMissing"
        :label="$t('$ezreeport.editor.aggregation.missing:show')"
        :readonly="readonly"
        :prepend-icon="mdiProgressQuestion"
        color="primary"
        hide-details
      />
    </v-col>

    <v-col cols="6">
      <v-slide-x-transition>
        <v-text-field
          v-if="showMissing"
          v-model="currentMissing"
          :label="$t('$ezreeport.editor.aggregation.missing:label')"
          :readonly="readonly"
          :disabled="disabled"
          :prepend-icon="mdiTooltipQuestionOutline"
          variant="underlined"
          hide-details
        />
      </v-slide-x-transition>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import type {
    AggregationType,
    FigureFilterAggregation,
    FigureFilterAggregationEntry,
  } from '~sdk/helpers/aggregations';
  import type { TemplateFilterMap } from '~sdk/helpers/filters';
  import {
    mdiDelete,
    mdiFormatListBulletedSquare,
    mdiPencil,
    mdiPlus,
    mdiProgressQuestion,
    mdiRename,
    mdiTooltipQuestionOutline,
  } from '@mdi/js';

  // Component props
  /** Aggregation to edit */
  const modelValue = defineModel<FigureFilterAggregation>({
    required: true,
  });

  defineProps<{
    /** Should be disabled */
    disabled?: boolean;
    /** Should be readonly */
    readonly?: boolean;
    /** Types of aggregations allowed in options */
    allowedType?: AggregationType;
  }>();

  // Utils composables
  const { t } = useI18n();

  const isValid = shallowRef(false);
  const showForm = shallowRef(false);
  const currentEntries = ref(
    new Map<string, FigureFilterAggregationEntry>(
      modelValue.value.values?.map((entry) => [entry.label, entry])
    )
  );
  /** Currently edited entry */
  const editedItem = ref<
    { id: string; entry: FigureFilterAggregationEntry } | undefined
  >();
  const editedItemFilters = ref<TemplateFilterMap | undefined>();

  /** Current aggregation type */
  const currentType = computed<FigureFilterAggregation['type']>({
    get: () => modelValue.value.type,
    set: (type) => {
      modelValue.value.type = type;
    },
  });
  /** Current aggregation missing */
  const currentMissing = computed<string | undefined>({
    get: () => modelValue.value.missing,
    set: (text) => {
      modelValue.value.missing = text;
    },
  });
  /** If we should show the missing values */
  const showMissing = computed({
    get: () => Boolean(currentMissing.value),
    set: (value) => {
      modelValue.value.missing = value ? 'Missing' : undefined;
    },
  });

  function openForm(value?: {
    id: string;
    entry: FigureFilterAggregationEntry;
  }): void {
    const entry = value?.entry ?? {
      filters: [],
      label: '',
    };

    editedItem.value = value ?? {
      entry,
      id: '',
    };

    editedItemFilters.value = new Map(
      entry.filters.map((filter) => [filter.name, filter])
    );

    showForm.value = true;
  }

  function upsertEditedEntry(): void {
    if (!editedItem.value) {
      return;
    }

    const entry = {
      ...editedItem.value.entry,
      filters: [...(editedItemFilters.value?.values() ?? [])],
    };

    currentEntries.value.set(editedItem.value.id || entry.label, entry);
    modelValue.value.values = [...currentEntries.value.values()];

    showForm.value = false;
    editedItem.value = undefined;
    editedItemFilters.value = undefined;
  }
</script>
