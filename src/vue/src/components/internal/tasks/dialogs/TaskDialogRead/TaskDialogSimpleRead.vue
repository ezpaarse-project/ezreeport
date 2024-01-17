<template>
  <v-dialog
    :value="props.value"
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
      <v-card-title>
        <span v-if="task">{{ task.name }}</span>

        <v-spacer />

        <slot name="toolbar" />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-subtitle>
        <MiniTagsDetail v-if="extendedTemplate" :model-value="extendedTemplate.tags" />
      </v-card-subtitle>

      <v-card-text style="position: relative">
        <v-form v-if="task">
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
              <v-text-field
                v-if="task.template.fetchOptions"
                :value="task.template.fetchOptions.index"
                :label="$t('$ezreeport.fetchOptions.index').toString()"
                prepend-icon="mdi-database"
                readonly
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <v-combobox
                v-model="task.targets"
                :label="$t('$ezreeport.tasks.targets')"
                multiple
                readonly
                class="target-cb"
                prepend-icon="mdi-email-multiple"
              >
                <template #append>
                  <div />
                </template>

                <template v-slot:selection="{ item, attrs }">
                  <v-chip
                    :key="item"
                    small
                    outlined
                    v-bind="attrs"
                  >
                    {{ item }}
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
        <v-btn v-if="perms.runTask" color="warning" @click="showGenerateDialog">
          {{ $t('$ezreeport.generate') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { tasks, templates } from '@ezpaarse-project/ezreeport-sdk-js';
import { ref, computed, watch } from 'vue';

import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';
import useTemplateStore from '~/stores/template';

const props = defineProps<{
  value: boolean;
  id: string;
  namespace?: string;
}>();

defineEmits<{
  (e: 'input', value: boolean): void;
}>();

const { sdk, ...ezr } = useEzR();
const { $t } = useI18n();
const templateStore = useTemplateStore();

const loading = ref(false);
const generationDialogShown = ref(false);
const task = ref<tasks.FullTask | undefined>(undefined);
const extendedTemplate = ref<templates.FullTemplate | undefined>(undefined);
const error = ref('');

const perms = computed(() => {
  const has = ezr.hasNamespacedPermission;
  const namespaces = task.value ? [task.value.namespace.id] : [];

  return {
    runTask: has('tasks-post-task-_run', namespaces),
  };
});
const currentNamespace = computed(() => {
  if (!task.value) {
    return undefined;
  }

  return ezr.namespaces.value.data.find((e) => e.id === task.value?.namespace.id);
});

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

    templateStore.indices.mapping = [];
    await Promise.all([
      templateStore.refreshAvailableIndices(),
      content.extends && fetchTemplate(content.extends.id),
    ]);

    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
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

<style lang="scss" scoped>
.target-cb::v-deep > .v-input__control > .v-input__slot {
  &:before,
  &:after {
    display: none;
  }
}
</style>

<style lang="scss" scoped>
.target-cb::v-deep > .v-input__control > .v-input__slot {
  &:before,
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
