<template>
  <v-card :title="$t('$ezreeport.task.title:edit')" :prepend-icon="mdiEmail">
    <template #append>
      <TemplateLocaleFlag
        v-if="modelValue.extends?.locale"
        v-tooltip:left="
          $t(`$ezreeport.template.locales.${modelValue.extends?.locale}`)
        "
        :modelValue="modelValue.extends?.locale"
      />

      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row>
          <v-col>
            <v-text-field
              v-model="task.name"
              :label="$t('$ezreeport.name')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :prepend-icon="mdiRename"
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
              :prepend-icon="mdiFolder"
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
              :rules="[(val) => val.length > 0 || $t('$ezreeport.required')]"
              :item-rules="[
                (val, i) =>
                  isEmail(val) || $t('$ezreeport.errors.invalidEmail', i + 1),
              ]"
              :item-placeholder="$t('$ezreeport.task.targets:hint')"
              :prepend-icon="mdiMailbox"
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
              :prepend-icon="mdiText"
              variant="underlined"
            />
          </v-col>
        </v-row>

        <v-expansion-panels class="mt-4">
          <v-expansion-panel eager>
            <template #title>
              <v-icon start :icon="mdiTools" />

              {{ $t('$ezreeport.advanced') }}
            </template>

            <template #text>
              <IndexSelector
                v-model="task.template.index"
                :namespace-id="task.namespaceId"
                :rules="[(val) => !!val || $t('$ezreeport.required')]"
                required
                @index:valid="refreshMapping($event)"
              />

              <EditorFilterList v-model="filters" />

              <v-btn
                v-if="showAdvanced"
                v-tooltip:top="$t('$ezreeport.superUserMode:tooltip')"
                :text="$t('$ezreeport.superUserMode')"
                :prepend-icon="mdiTools"
                :append-icon="mdiTools"
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
        :append-icon="mdiPencil"
        color="primary"
        @click="save()"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
  import type { Namespace } from '~sdk/namespaces';
  import {
    mdiEmail,
    mdiFolder,
    mdiMailbox,
    mdiPencil,
    mdiRename,
    mdiText,
    mdiTools,
  } from '@mdi/js';
  import { getCurrentNamespaces } from '~sdk/auth';
  import {
    type InputTask,
    type Task,
    createTask,
    upsertTask,
  } from '~sdk/tasks';

  import { isEmail } from '~/utils/validate';

  // Components props
  const props = defineProps<{
    /** The task to edit */
    modelValue: Task;
    /** Should show namespace */
    showNamespace?: boolean;
    /** Should show advanced button */
    showAdvanced?: boolean;
  }>();

  // Components events
  const emit = defineEmits<{
    /** Updated task */
    (event: 'update:modelValue', value: Task): void;
    /** Asked to open task in advanced form */
    (event: 'open:advanced', value: InputTask): void;
  }>();

  // Utils composables
  const { t } = useI18n();
  const { refreshMapping } = useTemplateEditor({
    // Grid: props.modelValue.template.grid,
    index: props.modelValue.template.index,
    dateField: props.modelValue.template.dateField,
    namespaceId: props.modelValue.namespaceId,
  });

  /** Is basic form valid */
  const isValid = shallowRef(false);
  /** Are namespaces loading */
  const loadingNamespaces = shallowRef(false);
  /** Task to create */
  const task = ref<InputTask>({
    description: props.modelValue.description,
    enabled: props.modelValue.enabled,
    extendedId: props.modelValue.extendedId,
    lastExtended: props.modelValue.lastExtended,
    name: props.modelValue.name,
    namespace: props.modelValue.namespace,
    namespaceId: props.modelValue.namespaceId,
    nextRun: props.modelValue.nextRun,
    recurrence: props.modelValue.recurrence,
    recurrenceOffset: props.modelValue.recurrenceOffset,
    targets: props.modelValue.targets,
    template: props.modelValue.template,
  });

  /** Filters of task */
  const filters = computed({
    get: () =>
      new Map(
        (task.value.template.filters ?? []).map((fil) => [fil.name, fil])
      ),
    set: (value) => {
      const values = [...value.values()];
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
  const namespace = computedAsync(
    async () => {
      let value: Omit<Namespace, 'fetchLogin' | 'fetchOptions'> | undefined;

      if (isNamespaced.value) {
        return value;
      }

      try {
        const currentNamespaces = await getCurrentNamespaces();
        value = currentNamespaces.find((nsp) => nsp.id === namespaceId.value);
      } catch (error) {
        handleEzrError(t('$ezreeport.task.errors.fetchNamespaces'), error);
      }

      return value;
    },
    undefined,
    { evaluating: loadingNamespaces }
  );

  function onTargetUpdated(targets: string | string[] | undefined): void {
    if (targets == null) {
      task.value.targets = [];
      return;
    }

    let allTargets = targets;
    if (!Array.isArray(allTargets)) {
      allTargets = [allTargets];
    }

    // Allow multiple mail addresses, separated by semicolon or comma
    task.value.targets = [
      ...new Set(
        allTargets
          .join(';')
          .replaceAll(/[,]/g, ';')
          .split(';')
          .map((mail) => mail.trim())
      ),
    ];
  }

  async function save(): Promise<void> {
    try {
      const data = { ...task.value, id: undefined };

      let result;
      if (props.modelValue.id) {
        result = await upsertTask({ ...data, id: props.modelValue.id });
      } else {
        result = await createTask(data);
      }

      emit('update:modelValue', result);
    } catch (error) {
      handleEzrError(t('$ezreeport.task.errors.edit'), error);
    }
  }
</script>
