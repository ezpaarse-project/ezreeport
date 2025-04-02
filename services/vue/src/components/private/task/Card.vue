<template>
  <v-card :title="modelValue.name">
    <template #subtitle>
      <div class="d-flex">
        <TemplateTagView :model-value="modelValue.extends?.tags ?? []" />

        <v-spacer />

        <v-chip
          :text="$t(`$ezreeport.task.recurrenceList.${modelValue.recurrence}`)"
          color="primary"
          variant="outlined"
          size="small"
        />
      </div>
    </template>

    <template #text>
      <v-list lines="two">
        <v-menu :close-on-content-click="false" max-height="250">
          <template #activator="{ props: menu }">
            <v-list-item
              :title="$t('$ezreeport.task.targets:count', modelValue.targets.length)"
              prepend-icon="mdi-mailbox"
              v-bind="menu"
            />
          </template>

          <v-sheet>
            <v-list-item density="compact">
              <template v-if="clipboard.isSupported" #append>
                <v-btn
                  v-tooltip:top="$t('$ezreeport.task.targets:copy')"
                  :icon="isCopied ? 'mdi-check' : 'mdi-content-copy'"
                  :color="isCopied ? 'success' : undefined"
                  density="comfortable"
                  size="small"
                  variant="flat"
                  @click="copyTargets()"
                />
              </template>
            </v-list-item>

            <v-list max-height="200" density="compact">
              <v-list-item v-for="target in modelValue.targets" :key="target" :title="target" />
            </v-list>
          </v-sheet>
        </v-menu>

        <v-menu v-if="modelValue.description" :close-on-content-click="false" max-width="500">
          <template #activator="{ props: menu }">
            <v-list-item
              :title="$t('$ezreeport.task.description')"
              prepend-icon="mdi-text"
              v-bind="menu"
            />
          </template>

          <v-card :text="modelValue.description" />
        </v-menu>

        <v-list-item
          v-if="modelValue.enabled"
          :subtitle="$t('$ezreeport.task.nextRun')"
          prepend-icon="mdi-calendar-clock"
        >
          <template #title>
            <LocalDate :model-value="modelValue.nextRun" format="PPP" />
          </template>
        </v-list-item>
      </v-list>
    </template>

    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import type { Task } from '~sdk/tasks';

// Components props
const props = defineProps<{
  /** The task to edit */
  modelValue: Omit<Task, 'template'>,
}>();

// Utils composables
const { t } = useI18n();
const clipboard = useClipboard();

const isCopied = ref(false);

async function copyTargets() {
  try {
    const addresses = props.modelValue.targets.join('; ');
    await clipboard.copy(addresses);

    isCopied.value = true;
    setTimeout(() => { isCopied.value = false; }, 1000);
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.copy:targets'), e);
  }
}
</script>
