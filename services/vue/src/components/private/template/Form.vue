<template>
  <v-card
    :title="
      modelValue.id
        ? $t('$ezreeport.template.title:edit')
        : $t('$ezreeport.template.title:new')
    "
    :prepend-icon="modelValue.id ? 'mdi-view-grid' : 'mdi-view-grid-plus'"
  >
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isFormValid">
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
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <TemplateTagList
              :model-value="modelValue.tags"
              :readonly="readonly"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <IndexSelector
              v-model="index"
              :readonly="readonly"
              @index:valid="refreshMapping($event)"
            />
          </v-col>

          <v-col>
            <v-combobox
              v-model="dateField"
              :label="$t('$ezreeport.template.dateField')"
              :items="dateMapping"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :return-object="false"
              :readonly="readonly"
              prepend-icon="mdi-calendar-search"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>
      </v-form>

      <v-row>
        <v-col>
          <EditorFilterList
            :model-value="modelValue.body.filters"
            :readonly="readonly"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-card
            :title="
              $t('$ezreeport.template.layouts', modelValue.body.layouts.length)
            "
            prepend-icon="mdi-grid"
            variant="outlined"
          >
            <template #append>
              <v-btn
                v-tooltip:top="$t('$ezreeport.template.editor:open')"
                icon="mdi-arrow-expand"
                color="primary"
                density="compact"
                variant="text"
                @click="openEditor()"
              />
            </template>

            <template #text>
              <v-row v-if="modelValue.body.layouts.length > 0">
                <v-col
                  v-for="(layout, index) in modelValue.body.layouts"
                  :key="layout.id"
                  cols="12"
                  sm="4"
                  md="2"
                >
                  <EditorPreviewLayout
                    :model-value="layout"
                    :readonly="readonly"
                    @click="openEditor(index)"
                  >
                    <template #prepend>
                      <span>{{ index + 1 }}</span>
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

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        v-if="!readonly"
        :text="modelValue.id ? $t('$ezreeport.save') : $t('$ezreeport.new')"
        :append-icon="modelValue.id ? 'mdi-content-save' : 'mdi-plus'"
        :disabled="!isValid || !hasChanged"
        color="primary"
        @click="emit('update:modelValue', modelValue)"
      />
    </template>

    <v-dialog
      v-model="isEditorVisible"
      transition="slide-x-reverse-transition"
      fullscreen
      scrollable
    >
      <EditorTemplate
        v-model:index="selectedIndex"
        :model-value="modelValue.body"
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
      </EditorTemplate>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import {
  hasTemplateChanged,
  type TemplateHelper,
} from '~sdk/helpers/templates';

// Components props
const props = defineProps<{
  /** The template to edit */
  modelValue: TemplateHelper;
  /** Should be readonly */
  readonly?: boolean;
}>();

// Components events
const emit = defineEmits<{
  /** Updated template */
  (event: 'update:modelValue', value: TemplateHelper): void;
}>();

// Utils composables
const { getOptionsFromMapping, refreshMapping, updateDateField } =
  useTemplateEditor({
    grid: props.modelValue.body.grid,
    index: props.modelValue.body.index,
    dateField: props.modelValue.body.dateField,
  });

/** Selected index */
const selectedIndex = ref(0);
/** Is basic form valid */
const isFormValid = ref(false);
/** Is editor visible */
const isEditorVisible = ref(false);

/** Validate on mount */
useTemplateVForm('formRef', { immediate: !!props.modelValue?.id });

/** Is valid */
const isValid = computed(() => isFormValid.value);
/** Mapping options for dateField */
const dateMapping = computed(() => getOptionsFromMapping('date'));
/** Has template changed since form is opened */
const hasChanged = computed(
  () => !props.modelValue.id || hasTemplateChanged(props.modelValue)
);
/** Name of the template */
const name = computed({
  get: () => props.modelValue.name,
  set: (value) => {
    const params = props.modelValue;
    params.name = value;
  },
});
/** Index of the template */
const index = computed({
  get: () => props.modelValue.body.index,
  set: (value) => {
    const { body } = props.modelValue;
    body.index = value;
  },
});
/** DateField of the template */
const dateField = computed({
  get: () => props.modelValue.body.dateField,
  set: (value) => {
    const { body } = props.modelValue;
    updateDateField(value);
    body.dateField = value;
  },
});

function openEditor(layoutIndex: number = 0) {
  selectedIndex.value = layoutIndex;
  isEditorVisible.value = true;
}

function closeEditor() {
  isEditorVisible.value = false;
}
</script>
