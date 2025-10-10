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
            icon="mdi-plus"
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
          prepend-icon="mdi-format-list-bulleted-square"
          @click="openForm({ id, entry })"
        >
          <template v-if="!readonly" #append>
            <v-btn
              v-tooltip:top="$t('$ezreeport.edit')"
              icon="mdi-pencil"
              color="blue"
              variant="text"
              density="comfortable"
              class="mr-2 ml-8"
            />

            <v-btn
              v-tooltip:top="$t('$ezreeport.delete')"
              icon="mdi-delete"
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
          prepend-icon="mdi-format-list-bulleted-square"
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
                    prepend-icon="mdi-rename"
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
              append-icon="mdi-pencil"
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
        prepend-icon="mdi-progress-question"
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
          prepend-icon="mdi-tooltip-question-outline"
          variant="underlined"
          hide-details
        />
      </v-slide-x-transition>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { TemplateFilterMap } from '~sdk/helpers/filters';
import type {
  AggregationType,
  FigureFilterAggregation,
  FigureFilterAggregationEntry,
} from '~sdk/helpers/aggregations';

// Component props
const props = defineProps<{
  /** Aggregation to edit */
  modelValue: FigureFilterAggregation;
  /** Should be disabled */
  disabled?: boolean;
  /** Should be readonly */
  readonly?: boolean;
  /** Types of aggregations allowed in options */
  allowedType?: AggregationType;
}>();

// Component events
const emit = defineEmits<{
  /** Aggregation updated */
  (event: 'update:modelValue', value: FigureFilterAggregation): void;
}>();

// Utils composables
// oxlint-disable-next-line id-length
const { t } = useI18n();

const isValid = shallowRef(false);
const showForm = shallowRef(false);
const currentEntries = ref<Map<string, FigureFilterAggregationEntry>>(
  new Map(props.modelValue.values.map((entry) => [entry.label, entry]))
);
/** Currently edited entry */
const editedItem = ref<
  { id: string; entry: FigureFilterAggregationEntry } | undefined
>();
const editedItemFilters = ref<TemplateFilterMap | undefined>();

/** Current aggregation type */
const currentType = computed<FigureFilterAggregation['type']>({
  get: () => props.modelValue.type,
  set: (type) => emit('update:modelValue', { ...props.modelValue, type }),
});
/** Current aggregation missing */
const currentMissing = computed<string | undefined>({
  get: () => props.modelValue.missing,
  set: (missing) => emit('update:modelValue', { ...props.modelValue, missing }),
});
/** If we should show the missing values */
const showMissing = computed({
  get: () => !!currentMissing.value,
  set: (value) =>
    emit('update:modelValue', {
      ...props.modelValue,
      missing: value ? 'Missing' : undefined,
    }),
});

function openForm(value?: {
  id: string;
  entry: FigureFilterAggregationEntry;
}): void {
  const entry = value?.entry ?? {
    label: '',
    filters: [],
  };

  editedItem.value = value ?? {
    id: '',
    entry,
  };

  editedItemFilters.value = new Map(
    entry.filters.map((filter) => [filter.name, filter]) ?? []
  );

  showForm.value = true;
}

function upsertEditedEntry(): void {
  if (!editedItem.value) {
    return;
  }

  const entry = {
    ...editedItem.value.entry,
    filters: Array.from(editedItemFilters.value?.values() ?? []),
  };

  currentEntries.value.set(editedItem.value.id || entry.label, entry);

  showForm.value = false;
  editedItem.value = undefined;
  editedItemFilters.value = undefined;
}

// Update props when map updates
watch(currentEntries, () => {
  emit('update:modelValue', {
    ...props.modelValue,
    values: Array.from(currentEntries.value.values()),
  });
});
</script>
