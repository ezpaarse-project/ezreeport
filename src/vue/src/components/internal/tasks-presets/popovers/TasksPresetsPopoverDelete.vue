<template>
  <v-menu
    :value="value"
    :position-x="coords.x"
    :position-y="coords.y"
    :close-on-content-click="false"
    absolute
    left
    max-width="450"
    min-width="450"
    @input="$emit('input', $event)"
  >
    <v-card :loading="loading">
      <v-card-title>
        {{$t('title')}}

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text style="position: relative">
        <div>
          {{$t('description', { name: preset.name })}}
        </div>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)">
          {{ $t('$ezreeport.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.delete"
          :loading="loading"
          color="error"
          @click="save"
        >
          {{ $t('$ezreeport.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { tasksPresets } from '@ezpaarse-project/ezreeport-sdk-js';
import { computed, ref } from 'vue';
import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

const props = defineProps<{
  value: boolean;
  preset: tasksPresets.TasksPreset;
  coords: { x: number, y: number };
}>();

const emit = defineEmits<{
  (e: 'input', show: boolean): void;
  (e: 'deleted', task: tasksPresets.TasksPreset): void;
}>();

const { $t } = useI18n();
const { sdk, ...ezr } = useEzR();

const loading = ref(false);
const error = ref('');

const perms = computed(() => {
  const has = ezr.hasGeneralPermission;

  return {
    delete: has('tasks-preset-delete-preset'),
  };
});

const save = async () => {
  if (!perms.value.delete) {
    return;
  }

  loading.value = true;
  try {
    await sdk.tasksPresets.deleteTasksPreset(props.preset.id);
    emit('deleted', props.preset);
    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};
</script>

<i18n lang="yaml">
en:
  title: 'Delete report preset ?'
  description: 'Do you really want to delete the report preset "{name}" ? This action is irreversible.'
fr:
  title: 'Supprimer le rapport prédéfini ?'
  description: 'Voulez-vous définitivement supprimer le rapport prédéfini "{name}" ? Cette action est irréversible.'
</i18n>
