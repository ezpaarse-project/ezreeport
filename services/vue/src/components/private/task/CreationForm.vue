<template>
  <v-card
    :title="$t('$ezreeport.task.title:new')"
    prepend-icon="mdi-email-plus"
  >
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row>
          <v-col>
            <v-autocomplete
              v-model="currentPreset"
              :label="$t('$ezreeport.task-preset.title')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :items="presets"
              :return-object="true"
              :loading="loadingPresets"
              item-value="id"
              item-title="name"
              prepend-icon="mdi-file"
              variant="underlined"
              required
              @update:model-value="onPresetChange($event)"
            >
              <template #append-inner>
                <div v-if="currentPreset" class="d-flex align-center">
                  <TemplateTagView
                    :model-value="currentPreset.template?.tags ?? []"
                  />

                  <v-chip
                    :text="
                      $t(
                        `$ezreeport.task.recurrenceList.${currentPreset.recurrence}`
                      )
                    "
                    color="primary"
                    variant="outlined"
                    size="small"
                    class="ml-2"
                  />
                </div>
              </template>

              <template #item="{ item: { raw: item }, props: listItem }">
                <v-list-item :title="item.name" lines="two" v-bind="listItem">
                  <template #subtitle>
                    <TemplateTagView :model-value="item.template?.tags ?? []" />
                  </template>

                  <template #append>
                    <v-chip
                      :text="
                        $t(`$ezreeport.task.recurrenceList.${item.recurrence}`)
                      "
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>

        <v-row v-if="!isNamespaced">
          <v-col>
            <v-autocomplete
              v-model="data.namespaceId"
              :label="$t('$ezreeport.namespace')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :items="namespaces"
              :return-object="false"
              :loading="loadingNamespaces"
              item-value="id"
              item-title="name"
              prepend-icon="mdi-folder"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-text-field
              v-model="data.name"
              :label="$t('$ezreeport.name')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              prepend-icon="mdi-rename"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <MultiTextField
              :model-value="data.targets"
              :label="$t('$ezreeport.task.targets')"
              :add-label="$t('$ezreeport.task.targets:add')"
              :rules="[(val) => val.length > 0 || $t('$ezreeport.required')]"
              :item-rules="[
                (val, i) =>
                  isEmail(val) || $t('$ezreeport.errors.invalidEmail', i + 1),
              ]"
              :item-placeholder="$t('$ezreeport.task.targets:hint')"
              prepend-icon="mdi-mailbox"
              variant="underlined"
              required
              @update:model-value="onTargetUpdated($event)"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-textarea
              v-model="data.description"
              :label="$t('$ezreeport.task.description')"
              prepend-icon="mdi-text"
              variant="underlined"
            />
          </v-col>
        </v-row>

        <v-expansion-panels class="mt-4">
          <v-expansion-panel eager>
            <template #title>
              <v-icon start icon="mdi-tools" />

              {{ $t('$ezreeport.advanced') }}
            </template>

            <template #text>
              <IndexSelector
                v-model="data.index"
                :namespace-id="data.namespaceId"
                :rules="[(val) => !!val || $t('$ezreeport.required')]"
                required
                @index:valid="refreshMapping($event)"
              />

              <EditorFilterList v-model="filters" />

              <v-btn
                v-if="showAdvanced"
                v-tooltip:top="$t('$ezreeport.superUserMode:tooltip')"
                :text="$t('$ezreeport.superUserMode')"
                prepend-icon="mdi-tools"
                append-icon="mdi-tools"
                color="warning"
                variant="flat"
                block
                class="mt-4"
                @click="emit('open:advanced', { data, preset: currentPreset })"
              />
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="$t('$ezreeport.new')"
        :disabled="!isValid"
        append-icon="mdi-plus"
        color="primary"
        @click="save()"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import type { Namespace } from '~sdk/namespaces';
import type { Task } from '~sdk/tasks';
import { getCurrentNamespaces } from '~sdk/auth';
import {
  getAllTaskPresets,
  createTaskFromPreset,
  type TaskPreset,
  type AdditionalDataForPreset,
} from '~sdk/task-presets';

import { isEmail } from '~/utils/validate';

// Component props
const props = defineProps<{
  /** Namespace to create task in */
  namespaceId?: string;
  /** Should show advanced button */
  showAdvanced?: boolean;
}>();

// Component events
const emit = defineEmits<{
  /** Updated task */
  (event: 'update:modelValue', value: Task): void;
  /** Asked to open task in advanced form */
  (
    event: 'open:advanced',
    value: { data: AdditionalDataForPreset; preset?: TaskPreset }
  ): void;
}>();

// Utils composables
// oxlint-disable-next-line id-length
const { t } = useI18n();
const { refreshMapping } = useTemplateEditor({
  namespaceId: props.namespaceId,
});

/** Is basic form valid */
const isValid = ref(false);
/** Task to create */
const data = ref<AdditionalDataForPreset>({
  name: '',
  description: '',
  index: '',
  namespaceId: props?.namespaceId ?? '',
  targets: [],
  filters: undefined,
});
/** Is preset list loading */
const loadingPresets = ref(false);
/** Current preset selected */
const currentPreset = ref<TaskPreset | undefined>();
/** Is namespace list loading */
const loadingNamespaces = ref(false);
/** Has name manually changed */
const hasNameChanged = ref(false);

/** Filters of task */
const filters = computed({
  get: () => new Map((data.value.filters ?? []).map((fil) => [fil.name, fil])),
  set: (value) => {
    const values = Array.from(value.values());
    if (values.length > 0) {
      data.value.filters = values;
      return;
    }
    data.value.filters = undefined;
  },
});
/** Preset list */
const presets = computedAsync(async () => {
  let items: TaskPreset[] = [];

  loadingPresets.value = true;
  try {
    ({ items } = await getAllTaskPresets({
      pagination: { count: 0, sort: 'name' },
      include: ['template.tags'],
    }));
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.fetchPresets'), err);
  }
  loadingPresets.value = false;

  return items;
}, []);
/** Is form namespaced */
const isNamespaced = computed(() => !!props.namespaceId);
/** Namespace list */
const namespaces = computedAsync(async () => {
  let items: Omit<Namespace, 'fetchLogin' | 'fetchOptions'>[] = [];

  if (isNamespaced.value) {
    return items;
  }

  loadingNamespaces.value = true;
  try {
    const currentNamespaces = await getCurrentNamespaces();
    items = currentNamespaces.sort((namespaceA, namespaceB) =>
      namespaceA.name.localeCompare(namespaceB.name)
    );
  } catch (err) {
    handleEzrError(t('$ezreeport.task.errors.fetchNamespaces'), err);
  }
  loadingNamespaces.value = false;

  return items;
}, []);

function onPresetChange(preset: TaskPreset | undefined) {
  data.value.index = preset?.fetchOptions.index || '';

  if (!hasNameChanged.value) {
    data.value.name = preset?.name || '';
  }
}

function onTargetUpdated(targets: string | string[] | undefined) {
  if (targets == null) {
    data.value.targets = [];
    return;
  }

  let allTargets = targets;
  if (!Array.isArray(allTargets)) {
    allTargets = [allTargets];
  }

  // Allow multiple mail addresses, separated by semicolon or comma
  data.value.targets = Array.from(
    new Set(
      allTargets
        .join(';')
        .replaceAll(/[,]/g, ';')
        .split(';')
        .map((mail) => mail.trim())
    )
  );
}

async function save() {
  if (!currentPreset.value) {
    return;
  }

  try {
    const result = await createTaskFromPreset(currentPreset.value, data.value);

    emit('update:modelValue', result);
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'statusCode' in err &&
      err.statusCode === 409
    ) {
      handleEzrError(t('$ezreeport.task.errors.create:duplicate'), err);
      return;
    }
    handleEzrError(t('$ezreeport.task.errors.create:preset'), err);
  }
}
</script>
