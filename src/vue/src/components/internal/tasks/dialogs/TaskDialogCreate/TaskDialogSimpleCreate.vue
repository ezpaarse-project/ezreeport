<template>
  <v-dialog
    :value="props.value"
    :persistent="!valid"
    max-width="600"
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading">
      <v-card-title>
        {{ $t('title') }}

        <v-spacer />

        <slot name="toolbar" />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text style="position: relative">
        <v-form v-if="miniTask" v-model="valid">

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
                @change="fetchPreset($event)"
              />
            </v-col>

            <v-col>
              <v-combobox
                v-if="miniTask.template.fetchOptions"
                :value="miniTask.template.fetchOptions.index"
                :search-input.sync="indexInput"
                :items="templateStore.indices.available"
                :label="$t('$ezreeport.fetchOptions.index').toString()"
                :rules="rules.index"
                :filter="indexFilter"
                prepend-icon="mdi-database"
                @blur="onIndexChanged"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-text-field
                v-model="miniTask.name"
                :rules="rules.name"
                :label="$t('$ezreeport.tasks.name')"
                prepend-icon="mdi-rename"
                hide-details="auto"
              />
              <MiniTagsDetail v-if="currentPreset" :model-value="currentPreset.template.tags" class="mt-2" />
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
          :disabled="!valid"
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
import { tasks, tasksPresets } from '@ezpaarse-project/ezreeport-sdk-js';
import isEmail from 'validator/lib/isEmail';
import { ref, computed, watch } from 'vue';

import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';
import useTemplateStore from '~/stores/template';
import { indexFilter } from '~/lib/elastic/indicies';

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
const templateStore = useTemplateStore();

const loading = ref(false);
const valid = ref(false);
const currentMapping = ref<Record<string, string> | null | undefined>(undefined);
const miniTask = ref<tasks.PartialInputTask | undefined>(undefined);
const availablePresets = ref<tasksPresets.TasksPreset[]>([]);
const currentPreset = ref<tasksPresets.FullTasksPreset | undefined>(undefined);
const indexInput = ref('');
const error = ref('');

const perms = computed(() => {
  const has = ezr.hasNamespacedPermission;

  return {
    create: has('tasks-post', []),
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
    (v: string) => !!v || $t('$ezreeport.errors.empty', { field: 'name' }),
  ],
  targets: [
    (v: string[]) => v.length > 0 || $t('$ezreeport.errors.empty', { field: 'targets' }),
    (v: string[]) => v.every((e) => isEmail(e)) || $t('$ezreeport.errors.email_format', { field: 'targets' }),
  ],
  preset: [
    (v: tasksPresets.TasksPreset) => !!v || $t('$ezreeport.errors.empty', { field: 'namespace' }),
  ],
  index: [
    (v: string) => !!v || $t('$ezreeport.errors.empty', { field: 'index' }),
    mappingValidation.value,
  ],
  namespace: [
    (v: string) => !!v || $t('$ezreeport.errors.empty', { field: 'namespace' }),
  ],
}));

/**
 * Fetches the mapping of the specified index
 */
const fetchMapping = async (index: string) => {
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

    templateStore.indices.mapping = [];
    await templateStore.refreshAvailableIndices();

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
  if (!miniTask.value || !currentPreset.value || !valid.value) {
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
const onIndexChanged = async () => {
  if (!miniTask.value) {
    return;
  }

  miniTask.value.template.fetchOptions = {
    ...(miniTask.value.template.fetchOptions ?? {}),
    index: indexInput.value,
  };
  await fetchMapping(indexInput.value);
};

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
    if (!newPreset || !miniTask.value) {
      return;
    }

    const name = miniTask.value?.name;
    if (name && name !== oldPreset?.name) {
      return;
    }

    miniTask.value = { ...miniTask.value, name: newPreset.name };
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
