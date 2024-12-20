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
              :rules="[(v) => !!v || $t('$ezreeport.required')]"
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
                  <TemplateTagView :model-value="currentPreset.template?.tags ?? []" />

                  <v-chip
                    :text="$t(`$ezreeport.task.recurrenceList.${currentPreset.recurrence}`)"
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
                      :text="$t(`$ezreeport.task.recurrenceList.${item.recurrence}`)"
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

        <v-row v-if="!namespaceId">
          <v-col>
            <v-autocomplete
              v-model="data.namespaceId"
              :label="$t('$ezreeport.namespace')"
              :rules="[(v) => !!v || $t('$ezreeport.required')]"
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
              :rules="[(v) => !!v || $t('$ezreeport.required')]"
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
              :rules="[(v) => v.length > 0 || $t('$ezreeport.required')]"
              prepend-icon="mdi-mailbox"
              variant="underlined"
              required
              @update:model-value="onTargetUpdated($event)"
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
                :rules="[(v) => !!v || $t('$ezreeport.required')]"
                required
                @index:valid="refreshMapping($event)"
              />

              <EditorFilterList v-model="filters" />
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

// Component props
const props = defineProps<{
  /** Namespace to create task in */
  namespaceId?: string;
}>();

// Component events
const emit = defineEmits<{
  /** Updated task */
  (e: 'update:modelValue', value: Task): void
}>();

// Utils composables
const { refreshMapping } = useTemplateEditor();

/** Is basic form valid */
const isValid = ref(false);
/** Task to create */
const data = ref<AdditionalDataForPreset>({
  name: '',
  index: '',
  namespaceId: props?.namespaceId ?? '',
  targets: [],
  filters: undefined,
});
/** Is preset list loading */
const loadingPresets = ref(false);
/** Presets list */
const presets = ref<TaskPreset[]>([]);
/** Current preset selected */
const currentPreset = ref<TaskPreset | undefined>();
/** Is namespace list loading */
const loadingNamespaces = ref(false);
/** Namespaces list */
const namespaces = ref<Omit<Namespace, 'fetchLogin' | 'fetchOptions'>[]>([]);
/** Has name manually changed */
const hasNameChanged = ref(false);

const filters = computed({
  get: () => new Map((data.value.filters ?? []).map((f) => [f.name, f])),
  set: (v) => {
    const values = Array.from(v.values());
    if (values.length > 0) {
      data.value.filters = values;
      return;
    }
    data.value.filters = undefined;
  },
});

function onPresetChange(preset: TaskPreset | undefined) {
  data.value.index = preset?.fetchOptions.index || '';

  if (!hasNameChanged.value) {
    data.value.name = preset?.name || '';
  }
}

function onTargetUpdated(targets: string | string[] | undefined) {
  if (!targets) {
    data.value.targets = [];
    return;
  }

  let allTargets = targets;
  if (!Array.isArray(allTargets)) {
    allTargets = [allTargets];
  }

  // Allow multiple mail addresses, separated by semicolon or comma
  data.value.targets = allTargets
    .join(';').replace(/[,]/g, ';')
    .split(';').map((mail) => mail.trim());
}

async function fetchPresets() {
  loadingPresets.value = true;
  try {
    const { items } = await getAllTaskPresets({ pagination: { count: 0, sort: 'name' }, include: ['template.tags'] });
    presets.value = items;
  } catch (e) {
    console.error(e);
  }
  loadingPresets.value = false;
}

async function fetchNamespaces() {
  loadingNamespaces.value = true;
  try {
    const currentNamespaces = await getCurrentNamespaces();
    namespaces.value = currentNamespaces.sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error(e);
  }
  loadingNamespaces.value = false;
}

async function save() {
  if (!currentPreset.value) {
    return;
  }

  try {
    const result = await createTaskFromPreset(currentPreset.value, data.value);

    emit('update:modelValue', result);
  } catch (e) {
    console.error(e);
  }
}

fetchPresets();
if (!props.namespaceId) {
  fetchNamespaces();
}
</script>
