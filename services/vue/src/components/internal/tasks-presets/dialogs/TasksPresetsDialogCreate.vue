<template>
  <v-dialog
    :value="value"
    :persistent="!valid || !nameValid"
    max-width="500"
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading">
      <v-card-title>
        <template v-if="preset">
          <v-text-field
            v-model="preset.name"
            :rules="rules.name"
            :label="$t('$ezreeport.taskPresets.name')"
          />

          <RecurrenceChip
            v-model="preset.recurrence"
            selectable
            size="small"
            classes="text-body-2 mx-2"
          />
        </template>

        <v-spacer />

        <slot name="toolbar" />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text style="position: relative">
        <v-form v-if="preset" v-model="valid">
          <v-row>
            <v-col>
              <TemplateProvider>
                <TemplateSelect
                  :value="preset.template"
                  :label="$t('$ezreeport.taskPresets.template').toString()"
                  @input="fetchTemplate($event)"
                />
              </TemplateProvider>
            </v-col>
          </v-row>

          <v-row v-if="preset.fetchOptions">
            <v-col>
              <v-combobox
                v-model="preset.fetchOptions.dateField"
                :label="$t('$ezreeport.fetchOptions.dateField')"
                :items="availableFields"
                :rules="rules.dateField"
              />
            </v-col>
          </v-row>

          <v-row v-if="preset.fetchOptions">
            <v-col>
              <ElasticIndexSelector
                :value="preset.fetchOptions.index || ''"
                :label="$t('$ezreeport.fetchOptions.index').toString()"
                required
                prepend-icon="mdi-database"
                @input="updateIndex($event)"
              />
            </v-col>
          </v-row>
        </v-form>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('$ezreeport.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.create"
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
import { ref, watch, computed } from 'vue';

import type { templates, tasksPresets } from '@ezpaarse-project/ezreeport-sdk-js';
import { merge } from 'lodash';
import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

const props = defineProps<{
  value: boolean,
}>();

const emit = defineEmits<{
  (e: 'input', val: boolean): void,
  (e: 'created', val: tasksPresets.FullTasksPreset): void,
}>();

const { $t } = useI18n();
const { sdk, ...ezr } = useEzR();

const preset = ref<tasksPresets.InputTasksPreset | undefined>();
const template = ref<templates.FullTemplate['body'] | undefined>();
const availableFields = ref<string[] | undefined>();
const valid = ref(false);
const loading = ref(false);
const error = ref('');

const perms = computed(() => {
  const has = ezr.hasGeneralPermission;
  return {
    create: has('tasks-preset-post'),
  };
});
/**
 * Validation rules
 */
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
const nameValid = computed(() => rules.value.name.every((r) => r(preset.value?.name || '') === true));
const templateValid = computed(() => rules.value.template.every((r) => r(preset.value?.template || '') === true));

/**
 * Initialise dialog
 */
const init = () => {
  preset.value = {
    name: '',
    template: '',
    fetchOptions: { dateField: '' },
    recurrence: sdk.tasks.Recurrence.DAILY,
  };
};

/**
 * Fetches the mapping for the specified index.
 *
 * @param index - The index to fetch the mapping for.
 */
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

/**
 * Fetches a template with the specified ID asynchronously.
 *
 * @param id - The ID of the template to fetch.
 */
const fetchTemplate = async (id: string) => {
  if (!preset.value) {
    return;
  }

  loading.value = true;
  try {
    const { content } = await sdk.templates.getTemplate(id);

    const { body, ...data } = content;

    template.value = body;
    preset.value = merge(
      {},
      preset.value,
      {
        template: data.id,
        fetchOptions: {
          dateField: body.fetchOptions?.dateField,
        },
      },
    );

    error.value = '';
    if (!body.fetchOptions?.dateField && body.fetchOptions?.index) {
      await fetchMapping(body.fetchOptions.index);
    }
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};

const updateIndex = (index: string) => {
  if (!preset.value) {
    return;
  }

  if (!availableFields.value) {
    fetchMapping(index);
  }

  preset.value = {
    ...preset.value,
    fetchOptions: {
      ...(preset.value.fetchOptions ?? {}),
      index,
    }
  }
}

/**
 * Save the preset
 */
const save = async () => {
  if (!preset.value || !valid.value || !templateValid.value || !nameValid.value) {
    return;
  }

  if (!perms.value.create) {
    emit('input', false);
    return;
  }

  loading.value = true;
  try {
    const { content } = await sdk.tasksPresets.createTasksPreset(preset.value);

    emit('created', content);
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
