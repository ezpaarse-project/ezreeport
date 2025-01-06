<template>
  <v-card
    :title="$t('$ezreeport.task.title:edit')"
    prepend-icon="mdi-email"
  >
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row>
          <v-col>
            <v-text-field
              v-model="task.name"
              :label="$t('$ezreeport.name')"
              :rules="[(v) => !!v || $t('$ezreeport.required')]"
              prepend-icon="mdi-rename"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>

        <v-row v-if="showNamespace">
          <v-col>
            <v-text-field
              :model-value="namespace?.name || task.namespaceId"
              :label="$t('$ezreeport.namespace')"
              prepend-icon="mdi-folder"
              variant="plain"
              readonly
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <MultiTextField
              :model-value="task.targets"
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
                v-model="task.template.index"
                :namespace-id="task.namespaceId"
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
        :text="$t('$ezreeport.edit')"
        :disabled="!isValid"
        append-icon="mdi-pencil"
        color="primary"
        @click="save()"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import type { Namespace } from '~sdk/namespaces';
import { getCurrentNamespaces } from '~sdk/auth';
import {
  upsertTask,
  type Task,
  type InputTask,
} from '~sdk/tasks';

// Components props
const props = defineProps<{
  /** The task to edit */
  modelValue: Task,
  /** Should show namespace */
  showNamespace?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated task */
  (e: 'update:modelValue', value: Task): void
}>();

// Utils composables
const { t } = useI18n();
const { refreshMapping } = useTemplateEditor();

/** Is basic form valid */
const isValid = ref(false);
/** Are namespaces loading */
const loadingNamespaces = ref(false);
/** Current namespace */
const namespace = ref<Omit<Namespace, 'fetchLogin' | 'fetchOptions'> | undefined>();
/** Task to create */
const task = ref<InputTask>({
  name: props.modelValue.name,
  namespaceId: props.modelValue.namespaceId,
  extendedId: props.modelValue.extendedId,
  template: props.modelValue.template,
  lastExtended: props.modelValue.lastExtended,
  targets: props.modelValue.targets,
  recurrence: props.modelValue.recurrence,
  nextRun: props.modelValue.nextRun,
  enabled: props.modelValue.enabled,
  namespace: props.modelValue.namespace,
});

const filters = computed({
  get: () => new Map((task.value.template.filters ?? []).map((f) => [f.name, f])),
  set: (v) => {
    const values = Array.from(v.values());
    if (values.length > 0) {
      task.value.template.filters = values;
      return;
    }
    task.value.template.filters = undefined;
  },
});

function onTargetUpdated(targets: string | string[] | undefined) {
  if (!targets) {
    task.value.targets = [];
    return;
  }

  let allTargets = targets;
  if (!Array.isArray(allTargets)) {
    allTargets = [allTargets];
  }

  // Allow multiple mail addresses, separated by semicolon or comma
  task.value.targets = allTargets
    .join(';').replace(/[,]/g, ';')
    .split(';').map((mail) => mail.trim());
}

async function refreshNamespace() {
  loadingNamespaces.value = true;
  try {
    const currentNamespaces = await getCurrentNamespaces();
    namespace.value = currentNamespaces.find((n) => n.id === task.value.namespaceId);
  } catch (e) {
    handleEzrError(t('$ezreeport.errors.refreshNamespaces'), e);
  }
  loadingNamespaces.value = false;
}

async function save() {
  try {
    const result = await upsertTask({ ...task.value, id: props.modelValue.id });

    emit('update:modelValue', result);
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.update'), e);
  }
}

if (props.showNamespace) {
  refreshNamespace();
}
</script>
