<template>
  <v-card
    :title="
      modelValue.id
        ? $t('$ezreeport.template.title:edit')
        : $t('$ezreeport.template.title:new')
    "
    :prepend-icon="modelValue.id ? mdiViewGrid : mdiViewGridPlus"
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
              :prepend-icon="mdiRename"
              variant="underlined"
              required
            />
          </v-col>

          <v-col cols="3">
            <v-select
              v-model="locale"
              :label="$t('$ezreeport.template.locale')"
              :items="localeItems"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :readonly="readonly"
              :prepend-icon="mdiFlag"
              variant="underlined"
              required
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <TemplateLocaleFlag :modelValue="item.value" />
                  </template>
                </v-list-item>
              </template>
            </v-select>
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
              :prepend-icon="mdiCalendarSearch"
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
            :prepend-icon="mdiGrid"
            variant="outlined"
          >
            <template #append>
              <v-btn
                v-tooltip:top="$t('$ezreeport.template.editor:open')"
                :icon="mdiArrowExpand"
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
                    :icon="mdiGridOff"
                  >
                    <template #actions>
                      <v-btn
                        :text="$t('$ezreeport.template.editor:open')"
                        color="primary"
                        :append-icon="mdiArrowExpand"
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
        :append-icon="modelValue.id ? mdiContentSave : mdiPlus"
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
            :icon="mdiClose"
            variant="text"
            density="comfortable"
            @click="closeEditor()"
          />
        </template>

        <template #actions>
          <v-btn
            v-if="readonly"
            :text="$t('$ezreeport.close')"
            :append-icon="mdiClose"
            @click="closeEditor()"
          />
          <v-btn
            v-else
            :text="$t('$ezreeport.confirm')"
            :append-icon="mdiCheck"
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
    mdiArrowExpand,
    mdiCalendarSearch,
    mdiCheck,
    mdiClose,
    mdiContentSave,
    mdiFlag,
    mdiGrid,
    mdiGridOff,
    mdiPlus,
    mdiRename,
    mdiViewGrid,
    mdiViewGridPlus,
  } from '@mdi/js';
  import {
    type TemplateHelper,
    hasTemplateChanged,
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
  const { t } = useI18n();
  const { getOptionsFromMapping, refreshMapping, updateDateField } =
    useTemplateEditor({
      dateField: props.modelValue.body.dateField,
      grid: props.modelValue.body.grid,
      index: props.modelValue.body.index,
    });

  /** Selected index */
  const selectedIndex = shallowRef(0);
  /** Is basic form valid */
  const isFormValid = shallowRef(false);
  /** Is editor visible */
  const isEditorVisible = shallowRef(false);

  /** Validate on mount */
  useTemplateVForm('formRef', { immediate: Boolean(props.modelValue?.id) });

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
  /** Locale of the template */
  const locale = computed({
    get: () => props.modelValue.locale,
    set: (value) => {
      const params = props.modelValue;
      params.locale = value;
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
  /** Items available to set locale */
  const localeItems = computed(() => [
    {
      title: t('$ezreeport.template.locales.en'),
      value: 'en',
    },
    {
      title: t('$ezreeport.template.locales.fr'),
      value: 'fr',
    },
  ]);

  function openEditor(layoutIndex = 0): void {
    selectedIndex.value = layoutIndex;
    isEditorVisible.value = true;
  }

  function closeEditor(): void {
    isEditorVisible.value = false;
  }
</script>

<style lang="css" scoped>
  .locale-flag :deep(.v-img__img) {
    object-fit: initial;
  }
  .locale-flag--cover :deep(.v-img__img) {
    object-fit: cover;
  }
</style>
