<template>
  <v-col v-if="perms.readAll">
    <TasksPresetsDialogCreate
      v-if="perms.create"
      v-model="createPresetDialogShown"
      @created="onPresetCreated"
    />
    <TasksPresetsDialogUpdate
      v-if="perms.update && focusedPreset"
      v-model="updatePresetDialogShown"
      :preset="focusedPreset"
      @updated="onPresetUpdated"
    />
    <TasksPresetsDialogRead
      v-if="perms.readOne && focusedPreset"
      v-model="readPresetDialogShown"
      :preset="focusedPreset"
    />
    <TasksPresetsPopoverDelete
      v-if="perms.delete && focusedPreset"
      v-model="deletePresetPopoverShown"
      :coords="deletePresetPopoverCoords"
      :preset="focusedPreset"
      @deleted="onPresetDeleted"
    />

    <v-data-iterator
      :items="presets"
      :items-per-page="12"
      :footer-props="{
        itemsPerPageOptions: [4, 8, 12, -1],
      }"
      item-key="id"
    >
      <template #header>
        <LoadingToolbar
          :text="toolbarTitle"
          :loading="loading"
          style="text-transform: capitalize;"
        >
          <RefreshButton
            :loading="loading"
            :tooltip="$t('refresh-tooltip').toString()"
            @click="fetch"
          />

          <v-tooltip top v-if="perms.create">
            <template #activator="{ on, attrs }">
              <v-btn icon color="success" @click="showCreateDialog" v-bind="attrs" v-on="on">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>

            {{$t('$ezreeport.create')}}
          </v-tooltip>
        </LoadingToolbar>
      </template>

      <template #no-data>
        <div style="position: relative; min-height: 150px;">
          <v-overlay v-if="!error" absolute>
            <div class="text-center">
              {{ $t('noDataText') }}
            </div>

            <v-btn color="primary" @click="showCreateDialog">
              <v-icon left>mdi-plus</v-icon>

              {{ $t('createFirst') }}
            </v-btn>
          </v-overlay>

          <ErrorOverlay v-model="error" hide-action />
        </div>
      </template>

      <template #default="{ items }">
        <v-row>
          <v-col
            v-for="preset in items"
            :key="preset.id"
            cols="3"
          >
            <v-card class="d-flex flex-column" style="height: 100%;">
              <v-card-title style="word-break: keep-all;">
                {{ preset.name }}
              </v-card-title>

              <v-card-subtitle class="d-flex">
                <MiniTagsDetail :model-value="preset.tags" />

                <v-spacer />

                <RecurrenceChip
                  :value="preset.recurrence"
                  size="small"
                  classes="ml-2"
                />
              </v-card-subtitle>

              <div style="flex: 1;" />

              <v-card-actions>
                <v-tooltip top>
                  <template #activator="{ attrs, on }">
                    <DateFormatDiv
                      :value="preset.updatedAt || preset.createdAt"
                      class="text-caption text--secondary font-italic"
                      :attrs="attrs"
                      :on="on"
                    />
                  </template>

                  <DateFormatDiv :value="preset.createdAt">
                    <template #default="{ date }">
                      {{ $t('created', { date }) }}
                    </template>
                  </DateFormatDiv>
                </v-tooltip>

                <v-spacer />

                <v-menu>
                  <template #activator="{ on, attrs }">
                    <v-btn
                      :ref="(el) => storeMenuRef(preset, el)"
                      icon
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-cog</v-icon>
                    </v-btn>
                  </template>

                  <v-list>
                    <v-list-item
                      v-if="perms.readOne && !perms.update"
                      @click="showReadDialog(preset)"
                    >
                      <v-list-item-action>
                        <v-icon>mdi-eye</v-icon>
                      </v-list-item-action>

                      <v-list-item-title>
                        {{ $t('$ezreeport.details') }}
                      </v-list-item-title>
                    </v-list-item>

                    <v-list-item v-if="perms.update" @click="showUpdateDialog(preset)">
                      <v-list-item-action>
                        <v-icon color="primary">mdi-pencil</v-icon>
                      </v-list-item-action>

                      <v-list-item-title>
                        {{ $t('$ezreeport.edit') }}
                      </v-list-item-title>
                    </v-list-item>

                    <v-list-item v-if="perms.delete" @click="showDeletePopover(preset)">
                      <v-list-item-action>
                        <v-icon color="error">mdi-delete</v-icon>
                      </v-list-item-action>

                      <v-list-item-title>
                        {{ $t('$ezreeport.delete') }}
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-card-actions>
            </v-card>
          </v-col>

        </v-row>
      </template>
    </v-data-iterator>
  </v-col>
</template>

<script setup lang="ts">
import type { tasksPresets } from '@ezpaarse-project/ezreeport-sdk-js';
import { computed, watch, ref } from 'vue';
import type { VMenu } from 'vuetify/lib/components';
import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

type VMenuInstance = InstanceType<typeof VMenu>;

const { $t, $tc } = useI18n();
const { sdk, ...ezr } = useEzR();

const readPresetDialogShown = ref(false);
const updatePresetDialogShown = ref(false);
const createPresetDialogShown = ref(false);
const deletePresetPopoverShown = ref(false);
const deletePresetPopoverCoords = ref({ x: 0, y: 0 });
const loading = ref(false);
const presets = ref<tasksPresets.TasksPreset[]>([]);
const presetMenusMap = ref<Record<string, VMenuInstance | undefined>>({});
const focusedPreset = ref<tasksPresets.TasksPreset | undefined>(undefined);
const error = ref('');

const perms = computed(() => {
  const has = ezr.hasGeneralPermission;
  return {
    readAll: has('tasks-preset-get'),
    readOne: has('tasks-preset-get-preset'),
    update: has('tasks-preset-put-preset'),
    create: has('tasks-preset-post'),
    delete: has('tasks-preset-delete-preset'),
  };
});
const toolbarTitle = computed(
  () => $t(
    'title',
    {
      title: $tc('$ezreeport.taskPresets.title', presets.value.length),
      count: presets.value.length,
    },
  ).toString(),
);

const storeMenuRef = (preset: tasksPresets.TasksPreset, el: VMenuInstance | null) => {
  if (!el) {
    presetMenusMap.value[preset.id] = undefined;
    return;
  }
  presetMenusMap.value[preset.id] = el;
};
const fetch = async () => {
  if (!perms.value.readAll) {
    presets.value = [];
    return;
  }

  loading.value = true;
  try {
    const { content } = await sdk.tasksPresets.getAllTasksPresets();
    if (!content) {
      throw new Error($t('$ezreeport.errors.fetch').toString());
    }

    presets.value = content;
    error.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  }
  loading.value = false;
};
const showCreateDialog = () => {
  createPresetDialogShown.value = true;
};
const onPresetCreated = async () => {
  createPresetDialogShown.value = false;
  await fetch();
};
const showUpdateDialog = (preset: tasksPresets.TasksPreset) => {
  focusedPreset.value = preset;
  updatePresetDialogShown.value = true;
};
const onPresetUpdated = async () => {
  updatePresetDialogShown.value = false;
  focusedPreset.value = undefined;
  await fetch();
};
const showReadDialog = (preset: tasksPresets.TasksPreset) => {
  focusedPreset.value = preset;
  readPresetDialogShown.value = true;
};
const showDeletePopover = (preset: tasksPresets.TasksPreset) => {
  let coords = { x: 0, y: 0 };
  const menu = presetMenusMap.value[preset.id];
  if (menu) {
    const rect = menu.$el.getBoundingClientRect();
    coords = {
      x: rect.left,
      y: rect.top,
    };
  }

  focusedPreset.value = preset;
  deletePresetPopoverCoords.value = coords;
  deletePresetPopoverShown.value = true;
};
const onPresetDeleted = async () => {
  deletePresetPopoverShown.value = false;
  focusedPreset.value = undefined;
  await fetch();
};

watch(
  () => ezr.auth.value.permissions,
  async () => { await fetch(); },
  { immediate: true },
);
</script>

<i18n lang="yaml">
en:
  noDataText: 'No report preset'
  createFirst: 'Create the first preset'
  refresh-tooltip: 'Refresh report presets list'
  title: '{title} ({count})'
  created: 'Created: {date}'
fr:
  noDataText: 'Aucun rapport prédéfini'
  createFirst: 'Créer le premier prédéfini'
  refresh-tooltip: 'Rafraîchir la liste des rapports de prédéfinis'
  title: '{title} ({count})'
  created: 'Créé le {date}'
</i18n>
