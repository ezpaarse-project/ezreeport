<template>
  <v-dialog
    :value="props.value"
    :persistent="!isValid"
    max-width="600"
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading">
      <v-card-title style="flex-wrap: nowrap;">
        <div class="pr-2" style="word-break: break-word;">
          {{ miniTask?.name }}

          <RenamePopover
            v-if="miniTask"
            v-model="miniTask.name"
            :label="$t('$ezreeport.tasks.name').toString()"
            :rules="rules.name"
          />
        </div>

        <v-spacer />

        <slot name="toolbar" />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-subtitle>
        {{ $t('title') }}
      </v-card-subtitle>

      <v-divider class="mb-2" />

      <v-card-text style="position: relative">
        <v-form v-if="miniTask" v-model="isValid">

          <v-row v-if="!props.namespace">
            <v-col>
              <div>
                {{ ezr.tcNamespace(true) }}:
              </div>

              <div class="d-flex">
                <v-icon class="mr-4">{{ ezr.namespaces.value.icon }}</v-icon>

                <div style="flex: 1">
                  <NamespaceSelect
                    :value="miniTask.namespace || ''"
                    :error-message="!miniTask.namespace ? $t('$ezreeport.errors.empty').toString() : undefined"
                    :needed-permissions="['tasks-post']"
                    hide-all
                    @input="onNamespaceChanged"
                  />
                </div>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-autocomplete
                :value="currentPreset?.id"
                :items="availablePresets"
                :label="$tc('$ezreeport.taskPresets.title')"
                :rules="rules.preset"
                item-text="name"
                item-value="id"
                prepend-icon="mdi-file"
                hide-details="auto"
                @change="fetchPreset($event)"
              >
                <template #item="{ item, attrs, on }">
                  <v-list-item two-line v-bind="attrs" v-on="on">
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ item.name }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="d-flex">
                        <MiniTagsDetail :model-value="item.tags" />

                        <v-spacer />

                        <RecurrenceChip
                          :value="item.recurrence"
                          size="x-small"
                        />
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </template>
              </v-autocomplete>

              <div v-if="currentPreset" class="d-flex mt-2 ml-8">
                <MiniTagsDetail :model-value="currentPreset.template.tags" />

                <v-spacer />

                <RecurrenceChip
                  :value="currentPreset.recurrence"
                  size="x-small"
                />
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <ElasticIndexSelector
                v-if="miniTask.template.fetchOptions"
                :value="miniTask.template.fetchOptions.index"
                :namespace="miniTask.namespace"
                :label="$t('$ezreeport.fetchOptions.index').toString()"
                :rules="rules.index"
                :disabled="!miniTask.namespace"
                required
                prepend-icon="mdi-database"
                @input="onIndexChanged"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-combobox
                v-model="miniTask.targets"
                :label="$t('$ezreeport.tasks.targets')"
                :rules="rules.targets"
                multiple
                prepend-icon="mdi-email-multiple"
                class="target-cb"
              >
                <template #append>
                  <div />
                </template>

                <template v-slot:selection="data">
                  <v-chip
                    :key="data.item"
                    :input-value="data.selected"
                    :disabled="data.disabled"
                    :color="!isEmail(data.item) ? 'error' : undefined"
                    small
                    close
                    @click:close="data.parent.selectItem(data.item)"
                    v-bind="data.attrs"
                  >
                    {{ data.item }}
                  </v-chip>
                </template>
              </v-combobox>
            </v-col>
          </v-row>
        </v-form>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('$ezreeport.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.create"
          :loading="loading"
          :disabled="!isValid || !isNameValid"
          color="success"
          @click="save"
        >
          {{ $t('$ezreeport.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { tasks, tasksPresets } from '@ezpaarse-project/ezreeport-sdk-js';
import isEmail from 'validator/lib/isEmail';

import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

const props = defineProps<{
  value: boolean;
  namespace?: string;
}>();

const emit = defineEmits<{
  (e: 'input', value: boolean): void;
  (e: 'created', value: tasks.FullTask): void;
}>();

const { sdk, ...ezr } = useEzR();
const { $t } = useI18n();

const loading = ref(false);
const isValid = ref(false);
const currentMapping = ref<Record<string, string> | null | undefined>(undefined);
const miniTask = ref<tasks.PartialInputTask | undefined>(undefined);
const availablePresets = ref<tasksPresets.TasksPreset[]>([]);
const currentPreset = ref<tasksPresets.FullTasksPreset | undefined>(undefined);
const indexInput = ref('');
const error = ref('');

const perms = computed(() => {
  const has = ezr.hasNamespacedPermission;
  const namespaces = props.namespace ? [props.namespace] : [];

  return {
    create: has('tasks-post', namespaces),
  };
});
const mappingValidation = computed(() => {
  if (currentMapping.value === null) {
    return $t('errors.mapping_no_rights').toString();
  }

  const dateField = miniTask.value?.template.fetchOptions?.dateField || currentPreset.value?.fetchOptions?.dateField || '';
  const fieldType = currentMapping.value?.[dateField];

  if (!fieldType) {
    return $t('errors.mapping_no_field', { dateField }).toString();
  }
  return fieldType === 'date' || $t('errors.mapping_no_date', { dateField }).toString();
});
/**
 * Validation rules
 */
const rules = computed(() => ({
  name: [
    (v: string) => !!v || $t('$ezreeport.errors.empty', { field: 'name' }).toString(),
  ],
  targets: [
    (v: string[]) => v.length > 0 || $t('$ezreeport.errors.empty', { field: 'targets' }),
    (v: string[]) => v.every((e) => isEmail(e)) || $t('$ezreeport.errors.email_format', { field: 'targets' }),
  ],
  preset: [
    (v: tasksPresets.TasksPreset) => !!v || $t('$ezreeport.errors.empty', { field: 'namespace' }),
  ],
  index: [
    mappingValidation.value,
  ],
  namespace: [
    (v: string) => !!v || $t('$ezreeport.errors.empty', { field: 'namespace' }),
  ],
}));
const isNameValid = computed(() => rules.value.name.every((r) => r(miniTask.value?.name || '')));

/**
 * Fetches the mapping of the specified index
 */
const fetchMapping = async (index: string) => {
  if (!index) {
    return;
  }

  if (!miniTask.value) {
    currentMapping.value = undefined;
    return;
  }

  try {
    const { content } = await sdk.elastic.getIndexMapping(
      index,
      miniTask.value.namespace || undefined,
    );

    currentMapping.value = content;
  } catch (err) {
    currentMapping.value = null;
  }
};
/**
 * Fetches a preset
 *
 * @param id - The ID of the preset
 */
const fetchPreset = async (id: string) => {
  if (!id) {
    return;
  }

  try {
    const { content } = await sdk.tasksPresets.getTasksPreset(id);

    currentPreset.value = content;
    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
};
/**
 * Fetch available presets and available indicies
 */
const refresh = async () => {
  currentPreset.value = undefined;
  miniTask.value = {
    name: '',
    targets: [],
    template: {
      fetchOptions: {
        index: '',
      },
    },
    namespace: props.namespace || '',
  };

  loading.value = true;
  try {
    const { content } = await sdk.tasksPresets.getAllTasksPresets();
    if (!content) {
      throw new Error($t('$ezreeport.errors.fetch').toString());
    }

    availablePresets.value = content;

    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};
/**
 * Transform mini task to full task and save it
 */
const save = async () => {
  if (!miniTask.value || !currentPreset.value || !isValid.value || !isNameValid.value) {
    return;
  }

  if (!perms.value.create) {
    emit('input', false);
    return;
  }

  loading.value = true;
  try {
    const { content } = await sdk.tasks.createTaskFromPreset(
      currentPreset.value?.id,
      miniTask.value,
    );

    emit('created', content);
    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};
const onNamespaceChanged = async (id: string) => {
  if (!miniTask.value) {
    return;
  }

  miniTask.value.namespace = id;
  await fetchMapping(indexInput.value);
};
const onIndexChanged = async (index: string) => {
  if (!miniTask.value) {
    return;
  }

  miniTask.value.template.fetchOptions = {
    ...(miniTask.value.template.fetchOptions ?? {}),
    index,
  };
  await fetchMapping(index);
};
const applyNameFromPreset = (
  newPreset: tasksPresets.FullTasksPreset | undefined,
  oldPreset: tasksPresets.FullTasksPreset | undefined
) => {
  if (!newPreset || !miniTask.value) {
    return;
  }

  const name = miniTask.value?.name;
  if (name && name !== oldPreset?.name) {
    return;
  }

  miniTask.value = { ...miniTask.value, name: newPreset.name };
}
const applyIndexFromPreset = (
  newPreset: tasksPresets.FullTasksPreset | undefined,
  oldPreset: tasksPresets.FullTasksPreset | undefined
) => {
  if (!newPreset || !miniTask.value) {
    return;
  }

  const index = miniTask.value?.template.fetchOptions?.index;
  if (index && index !== oldPreset?.fetchOptions?.index) {
    return;
  }

  miniTask.value = {
    ...miniTask.value,
    template: {
      ...miniTask.value.template,
      fetchOptions: { 
        ...(miniTask.value.template.fetchOptions ?? {}),
        index: newPreset.fetchOptions?.index || '',
      }
    }
  };
}

watch(
  () => props.value,
  (val) => {
    if (!val) {
      return;
    }

    refresh();
  },
  { immediate: true },
);

watch(
  currentPreset,
  (newPreset, oldPreset) => {
    applyNameFromPreset(newPreset, oldPreset);
    applyIndexFromPreset(newPreset, oldPreset);
  },
);
</script>

<style lang="scss" scoped>
.target-cb::v-deep > .v-input__control > .v-input__slot {
  &:after {
    display: none;
  }
}
</style>

<i18n lang="yaml">
en:
  title: 'New report'
  actions:
    cancel: 'Cancel'
    confirm: 'Confirm'
  errors:
    mapping_no_rights: "The rights on this index are insufficient"
    mapping_no_field: 'This index does not have a field "{dateField}"'
    mapping_no_date: 'The field {dateField} does not correspond to a date'
fr:
  title: 'Nouveau rapport'
  actions:
    cancel: 'Annuler'
    confirm: 'Confirmer'
  errors:
    mapping_no_rights: "Les droits sur cet index sont insuffisants"
    mapping_no_field: 'Cet index ne possède pas de champ "{dateField}"'
    mapping_no_date: 'Le champ {dateField} ne correspond pas à une date'
</i18n>
