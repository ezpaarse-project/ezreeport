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
              :add-label="$t('$ezreeport.task.targets:add')"
              :rules="[(v) => v.length > 0 || $t('$ezreeport.required')]"
              :item-rules="[(v, i) => isEmail(v) || $t('$ezreeport.errors.invalidEmail', i + 1)]"
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
              v-model="task.description"
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
                v-model="task.template.index"
                :namespace-id="task.namespaceId"
                :rules="[(v) => !!v || $t('$ezreeport.required')]"
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
                @click="emit('open:advanced', task)"
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
        :text="$t('$ezreeport.save')"
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
  createTask,
  type Task,
  type InputTask,
} from '~sdk/tasks';

import { isEmail } from '~/utils/validate';

// Components props
const props = defineProps<{
  /** The task to edit */
  modelValue: Task,
  /** Should show namespace */
  showNamespace?: boolean,
  /** Should show advanced button */
  showAdvanced?: boolean
}>();

// Components events
const emit = defineEmits<{
  /** Updated task */
  (e: 'update:modelValue', value: Task): void
  /** Asked to open task in advanced form */
  (e: 'open:advanced', value: InputTask): void
}>();

// Utils composables
const { t } = useI18n();
const { refreshMapping } = useTemplateEditor({
  // grid: props.modelValue.template.grid,
  index: props.modelValue.template.index,
  dateField: props.modelValue.template.dateField,
  namespaceId: props.modelValue.namespaceId,
});

/** Is basic form valid */
const isValid = ref(false);
/** Are namespaces loading */
const loadingNamespaces = ref(false);
/** Task to create */
const task = ref<InputTask>({
  name: props.modelValue.name,
  description: props.modelValue.description,
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

/** Filters of task */
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
/** Is form namespaced */
const isNamespaced = computed(() => !props.showNamespace);
/** Current namespace's id */
const namespaceId = computed(() => task.value.namespaceId);
/** Curent namespace */
const namespace = computedAsync(async () => {
  let value: Omit<Namespace, 'fetchLogin' | 'fetchOptions'> | undefined;

  if (isNamespaced.value) {
    return value;
  }

  loadingNamespaces.value = true;
  try {
    const currentNamespaces = await getCurrentNamespaces();
    value = currentNamespaces.find((n) => n.id === namespaceId.value);
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.fetchNamespaces'), e);
  }
  loadingNamespaces.value = false;

  return value;
});

function onTargetUpdated(targets: string | string[] | undefined) {
  if (targets == null) {
    task.value.targets = [];
    return;
  }

  let allTargets = targets;
  if (!Array.isArray(allTargets)) {
    allTargets = [allTargets];
  }

  // Allow multiple mail addresses, separated by semicolon or comma
  task.value.targets = Array.from(
    new Set(
      allTargets
        .join(';').replace(/[,]/g, ';')
        .split(';').map((mail) => mail.trim()),
    ),
  );
}

async function save() {
  try {
    let result;
    if (props.modelValue.id) {
      result = await upsertTask({ ...task.value, id: props.modelValue.id });
    } else {
      result = await createTask({ ...task.value });
    }

    emit('update:modelValue', result);
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.update'), e);
  }
}
</script>
