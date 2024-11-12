<template>
  <v-dialog
    :value="value"
    :persistent="!valid || !nameValid"
    max-width="500"
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading">
      <v-card-title class="d-flex">
        <template v-if="innerPreset">
          <v-text-field
            v-model="innerPreset.name"
            :rules="rules.name"
            :label="$t('$ezreeport.taskPresets.name')"
          />

          <RecurrenceChip
            v-model="innerPreset.recurrence"
            selectable
            size="small"
            classes="text-body-2 mx-2"
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
        <v-form v-if="innerPreset" v-model="valid">
          <v-row>
            <v-col>
              <TemplateProvider>
                <TemplateSelect
                  :value="innerPreset.template"
                  :label="$t('$ezreeport.taskPresets.template').toString()"
                  @input="fetchTemplate"
                />
              </TemplateProvider>
            </v-col>
          </v-row>

          <v-row v-if="innerPreset.fetchOptions">
            <v-col>
              <v-combobox
                v-model="innerPreset.fetchOptions.dateField"
                :label="$t('$ezreeport.fetchOptions.dateField')"
                :items="availableFields"
                :rules="rules.dateField"
              />
            </v-col>
          </v-row>
        </v-form>
        <LoadingOverlay v-else value />

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('$ezreeport.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.update"
          :loading="loading"
          :disabled="!valid || !nameValid"
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
import {
  ref,
  computed,
  watch,
} from 'vue';

import type { templates, tasksPresets } from '@ezpaarse-project/ezreeport-sdk-js';
import { merge } from 'lodash';
import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

const props = defineProps<{
  value: boolean,
  preset: tasksPresets.TasksPreset,
}>();

const emit = defineEmits<{
  (e: 'input', val: boolean): void,
  (e: 'updated', val: tasksPresets.FullTasksPreset): void,
}>();

const { $t } = useI18n();
const { sdk, ...ezr } = useEzR();

const innerPreset = ref<tasksPresets.InputTasksPreset | undefined>();
const template = ref<templates.FullTemplate['body'] | undefined>();
const availableFields = ref<string[] | undefined>();
const valid = ref(false);
const loading = ref(false);
const error = ref('');

const perms = computed(() => {
  const has = ezr.hasGeneralPermission;
  return {
    update: has('tasks-preset-put-preset'),
  };
});
const rules = computed(() => ({
  name: [
    (v: string) => !!v || $t('$ezreeport.errors.empty', { field: 'name' }),
  ],
  template: [
    (v: string) => !!v || $t('$ezreeport.errors.empty', { field: 'template' }),
  ],
  dateField: [
    (v: string) => !!v || $t('$ezreeport.errors.empty', { field: 'dateField' }),
  ],
}));
const nameValid = computed(() => rules.value.name.every((r) => r(innerPreset.value?.name || '') === true));
const templateValid = computed(() => rules.value.template.every((r) => r(innerPreset.value?.template || '') === true));

const fetchMapping = async (index: string) => {
  try {
    const { content } = await sdk.elastic.getIndexMapping(index);

    availableFields.value = Object.values(content)
      .filter(([, type]) => type === 'date')
      .map(([key]) => key);
  } catch (err) {
    availableFields.value = undefined;
  }
};

const fetchTemplate = async (id: string) => {
  loading.value = true;
  try {
    const { content } = await sdk.templates.getTemplate(id);

    const { body, ...data } = content;

    template.value = body;
    innerPreset.value = merge(
      {},
      innerPreset.value,
      {
        template: data.id,
        fetchOptions: {
          dateField: body.fetchOptions?.dateField,
        },
      },
    );

    if (!body.fetchOptions?.dateField && body.fetchOptions?.index) {
      await fetchMapping(body.fetchOptions.index);
    }

    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};

const fetchPreset = async (id: string) => {
  loading.value = true;
  try {
    const { content } = await sdk.tasksPresets.getTasksPreset(id);

    innerPreset.value = {
      name: content.name,
      hidden: content.hidden,
      recurrence: content.recurrence,
      template: content.template.id,
      fetchOptions: content.fetchOptions,
    };

    error.value = '';
    await fetchTemplate(content.template.id);
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};

const init = async () => {
  await fetchPreset(props.preset.id);
};

const save = async () => {
  if (!innerPreset.value || !valid.value || !templateValid.value || !nameValid.value) {
    return;
  }

  if (!perms.value.update) {
    emit('input', false);
    return;
  }

  loading.value = true;
  try {
    const { content } = await sdk.tasksPresets.upsertTasksPreset({
      ...innerPreset.value,
      id: props.preset.id,
    });

    emit('updated', content);
    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
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
