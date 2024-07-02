<template>
  <v-dialog
    :value="props.value"
    :persistent="!valid"
    max-width="600"
    @input="$emit('input', $event)"
  >
    <TaskDialogGeneration
      v-if="task && perms.runTask"
      v-model="generationDialogShown"
      :task="task"
      @generated="refresh()"
    />

    <v-card :loading="loading">
      <v-card-title style="flex-wrap: nowrap;">
        <div class="pr-2" style="word-break: break-word;">
          {{ task?.name || '...' }}

          <RenamePopover
            v-if="task"
            v-model="task.name"
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
        <MiniTagsDetail v-if="extendedTemplate" :model-value="extendedTemplate.tags" />

        {{ $t('title') }}
      </v-card-subtitle>

      <v-divider class="mb-2" />

      <v-card-text style="position: relative">
        <v-form v-if="task" v-model="valid" ref="formRef">
          <v-row v-if="!props.namespace">
            <v-col>
              <div>
                {{ ezr.tcNamespace(true) }}:
              </div>

              <div class="d-flex">
                <v-icon class="mr-4">{{ ezr.namespaces.value.icon }}</v-icon>

                <div style="flex: 1">
                  <NamespaceRichListItem
                    v-if="currentNamespace"
                    :namespace="currentNamespace"
                  />
                </div>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <ElasticIndexSelector
                v-if="task.template.fetchOptions"
                :value="task.template.fetchOptions.index"
                :namespace="task.namespace.id"
                :label="$t('$ezreeport.fetchOptions.index').toString()"
                :rules="rules.index"
                required
                prepend-icon="mdi-database"
                @input="onIndexChanged"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-combobox
                v-model="task.targets"
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
        <v-btn
          v-if="perms.runTask"
          :disabled="isModified"
          color="warning"
          @click="showGenerateDialog"
        >
          {{ $t('$ezreeport.generate') }}
        </v-btn>

        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('$ezreeport.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.update"
          :loading="loading"
          :disabled="!valid || !isNameValid || !isModified"
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
import type { tasks, templates } from '@ezpaarse-project/ezreeport-sdk-js';
import type VForm from 'vuetify/src/components/VForm';
import isEmail from 'validator/lib/isEmail';
import hash from 'object-hash';

import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

const props = defineProps<{
  value: boolean;
  id: string;
  namespace?: string;
}>();

const emit = defineEmits<{
  (e: 'input', value: boolean): void;
  (e: 'updated', value: tasks.FullTask): void;
}>();

const { sdk, ...ezr } = useEzR();
const { $t } = useI18n();

const loading = ref(false);
const valid = ref(false);
const generationDialogShown = ref(false);
const currentMapping = ref<Record<string, string> | null | undefined>(undefined);
const task = ref<tasks.FullTask | undefined>(undefined);
const taskHash = ref('');
const extendedTemplate = ref<templates.FullTemplate | undefined>(undefined);
const error = ref('');

const formRef = ref<InstanceType<typeof VForm> | undefined>();

const hashTask = (t: tasks.FullTask) => hash({
  name: t.name,
  index: t.template.fetchOptions?.index,
  targets: t.targets,
});

const perms = computed(() => {
  const has = ezr.hasNamespacedPermission;
  const namespaces = task.value ? [task.value.namespace.id] : [];

  return {
    update: has('tasks-put-task', namespaces),
    runTask: has('tasks-post-task-_run', namespaces),
  };
});
const mappingValidation = computed(() => {
  if (currentMapping.value === null) {
    return $t('errors.mapping_no_rights').toString();
  }

  const dateField = task.value?.template.fetchOptions?.dateField || extendedTemplate.value?.body.fetchOptions?.dateField || '';

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
  index: [
    mappingValidation.value,
  ],
  namespace: [
    (v: string) => !!v || $t('$ezreeport.errors.empty', { field: 'namespace' }),
  ],
}));
const isNameValid = computed(() => rules.value.name.every((r) => r(task.value?.name || '')));
const currentNamespace = computed(() => {
  if (!task.value) {
    return undefined;
  }

  return ezr.namespaces.value.data.find((e) => e.id === task.value?.namespace.id);
});
/**
 * If task was modified since last fetch
 */
const isModified = computed(() => {
  if (!task.value) {
    return false;
  }

  return hashTask(task.value) !== taskHash.value;
});

/**
 * Fetches the mapping of the specified index
 */
const fetchMapping = async (index: string) => {
  if (!task.value) {
    currentMapping.value = undefined;
    return;
  }

  try {
    const { content } = await sdk.elastic.getIndexMapping(
      index,
      task.value.namespace.id || undefined,
    );

    currentMapping.value = content;
  } catch (err) {
    currentMapping.value = null;
  }
};
/**
 * Fetches a template
 *
 * @param id - The ID of the template
 */
const fetchTemplate = async (id: string) => {
  try {
    const { content } = await sdk.templates.getTemplate(id);

    extendedTemplate.value = content;
    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
};
/**
 * Fetch current task and template
 */
const refresh = async () => {
  loading.value = true;
  try {
    const { content } = await sdk.tasks.getTask(props.id);
    if (!content) {
      throw new Error($t('$ezreeport.errors.fetch').toString());
    }

    task.value = content;
    taskHash.value = hashTask(content);

    const index = content.template.fetchOptions?.index || '';
    await Promise.all([
      content.extends && fetchTemplate(content.extends.id),
      fetchMapping(index),
    ]);
    formRef.value?.validate();

    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};
/**
 * Save new state of task
 */
const save = async () => {
  if (!task.value || !valid.value || !isNameValid.value || !isModified.value) {
    return;
  }

  if (!perms.value.update) {
    emit('input', false);
    return;
  }

  loading.value = true;
  try {
    const { content } = await sdk.tasks.upsertTask(
      {
        id: task.value.id,
        extends: task.value.extends?.id,
        name: task.value.name,
        recurrence: task.value.recurrence,
        targets: task.value.targets,
        template: task.value.template,
        enabled: task.value.enabled,
      },
    );

    emit('updated', content);
    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};
const onIndexChanged = async (index: string) => {
  if (!task.value) {
    return;
  }

  task.value.template.fetchOptions = {
    ...(task.value.template.fetchOptions ?? {}),
    index,
  };
  await fetchMapping(index);
};
/**
 * Prepare and show task generation dialog
 */
const showGenerateDialog = () => {
  if (!perms.value.runTask) {
    return;
  }

  generationDialogShown.value = true;
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
</script>

<i18n lang="yaml">
en:
  title: 'Update report'
  actions:
    cancel: 'Cancel'
    confirm: 'Confirm'
  errors:
    mapping_no_rights: "The rights on this index are insufficient"
    mapping_no_field: 'This index does not have a field "{dateField}"'
    mapping_no_date: 'The field {dateField} does not correspond to a date'
fr:
  title: "Mise à jour d'un rapport"
  actions:
    cancel: 'Annuler'
    confirm: 'Confirmer'
  errors:
    mapping_no_rights: "Les droits sur cet index sont insuffisants"
    mapping_no_field: 'Cet index ne possède pas de champ "{dateField}"'
    mapping_no_date: 'Le champ {dateField} ne correspond pas à une date'
</i18n>
