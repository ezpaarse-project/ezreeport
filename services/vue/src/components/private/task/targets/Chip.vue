<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props: menu }">
      <v-chip
        :text="showLabel ? $t('$ezreeport.task.targets:count', modelValue.length) : `${modelValue.length}`"
        prepend-icon="mdi-mailbox"
        :density="density"
        :size="size ?? 'small'"
        v-bind="menu"
      />
    </template>

    <v-sheet>
      <v-list-item density="compact">
        <template v-if="!showLabel" #title>
          <div class="text-overline">{{ $t('$ezreeport.task.targets') }}</div>
        </template>

        <template v-if="clipboard.isSupported" #append>
          <v-btn
            v-tooltip:top="$t('$ezreeport.task.targets:copy')"
            :icon="isCopied ? 'mdi-check' : 'mdi-content-copy'"
            :color="isCopied ? 'success' : undefined"
            density="comfortable"
            variant="flat"
            size="small"
            @click="copyTargets()"
          />
        </template>
      </v-list-item>

      <v-list max-height="200" density="compact">
        <v-list-item v-for="target in modelValue" :key="target" :title="target" />
      </v-list>
    </v-sheet>
  </v-menu>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string[],
  showLabel?: boolean,
  density?: 'default' | 'comfortable' | 'compact',
  size?: string | number,
}>();

// Utils composables
const { t } = useI18n();
const clipboard = useClipboard();

const isCopied = ref(false);

async function copyTargets() {
  try {
    const addresses = props.modelValue.join('; ');
    await clipboard.copy(addresses);

    isCopied.value = true;
    setTimeout(() => { isCopied.value = false; }, 1000);
  } catch (e) {
    handleEzrError(t('$ezreeport.task.errors.copy:targets'), e);
  }
}
</script>
