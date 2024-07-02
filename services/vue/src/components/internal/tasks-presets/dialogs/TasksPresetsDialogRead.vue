<template>
  <v-dialog
    :value="value"
    max-width="500"
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading">
      <v-card-title class="d-flex">
        <template v-if="innerPreset">
          <v-text-field
            :value="innerPreset.name"
            :label="$t('$ezreeport.taskPresets.name')"
            readonly
          />

          <RecurrenceChip
            :value="innerPreset.recurrence"
            size="small"
            classes="text-body-2 mx-2"
            readonly
          />
        </template>
        <template v-else>
          <v-skeleton-loader width="260" type="text" />
        </template>

        <v-spacer />

        <slot name="toolbar" />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text style="position: relative; min-height: 235px;">
        <v-form v-if="innerPreset">
          <v-row>
            <v-col>
              <TemplateProvider>
                <TemplateSelect
                  :value="innerPreset.template"
                  :label="$t('$ezreeport.taskPresets.template').toString()"
                  disabled
                />
              </TemplateProvider>
            </v-col>
          </v-row>

          <v-row v-if="innerPreset.fetchOptions">
            <v-col>
              <v-combobox
                :value="innerPreset.fetchOptions.dateField"
                :label="$t('$ezreeport.fetchOptions.dateField')"
                readonly
              />
            </v-col>
          </v-row>
        </v-form>
        <LoadingOverlay v-else value />

        <ErrorOverlay v-model="error" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
} from 'vue';

import type { tasksPresets } from '@ezpaarse-project/ezreeport-sdk-js';
import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

const props = defineProps<{
  value: boolean,
  preset: tasksPresets.TasksPreset,
}>();

defineEmits<{
  (e: 'input', val: boolean): void,
}>();

const { $t } = useI18n();
const { sdk } = useEzR();

const innerPreset = ref<tasksPresets.InputTasksPreset | undefined>();
const loading = ref(false);
const error = ref('');

const fetchPreset = async (id: string) => {
  loading.value = true;
  try {
    const { content } = await sdk.tasksPresets.getTasksPreset(id);

    innerPreset.value = {
      name: content.name,
      recurrence: content.recurrence,
      template: content.template.id,
      fetchOptions: content.fetchOptions,
    };

    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};

const init = async () => {
  await fetchPreset(props.preset.id);
};

watch(
  () => props.value,
  async (val) => {
    if (val) {
      await init();
    }
  },
  { immediate: true },
);
</script>

<i18n lang="yaml">
en:
  actions:
    cancel: 'Cancel'
    confirm: 'Confirm'
fr:
  actions:
    cancel: 'Annuler'
    confirm: 'Confirmer'
</i18n>
