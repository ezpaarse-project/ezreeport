<template>
  <v-menu :close-on-content-click="false" location="start">
    <template #activator="{ props }">
      <v-list-item
        :title="total.name"
        :subtitle="$t('$ezreeport.health.fsUsage', total)"
        v-bind="props"
      >
        <template #append>
          <v-progress-circular
            v-tooltip:left="$t('$ezreeport.health.fsUsage%', { value: total.percentageLabel })"
            :model-value="total.percentage"
            color="primary"
          />
        </template>
      </v-list-item>
    </template>

    <v-list lines="two" density="compact">
      <v-list-item
        v-for="[hostname, usage] in perHostname"
        :key="hostname"
        :title="usage.service"
        :subtitle="$t('$ezreeport.health.fsUsage', usage)"
      >
        <template #append>
          <v-progress-circular
            v-tooltip:left="$t('$ezreeport.health.fsUsage%', { value: usage.percentageLabel })"
            :model-value="usage.percentage"
            color="primary"
            class="ml-4"
          />
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import prettyBytes from 'pretty-bytes';
import type { FileSystemUsage } from '~sdk/health';

const props = defineProps<{
  modelValue: (FileSystemUsage & { host: { service: string, name: string } })[],
}>();

const { locale } = useI18n();

function prettyUsage(usage: FileSystemUsage) {
  const percentage = usage.used / usage.total;

  return {
    name: usage.name,
    available: prettyBytes(usage.available),
    used: prettyBytes(usage.used),
    total: prettyBytes(usage.total),
    percentage: percentage * 100,
    percentageLabel: percentage.toLocaleString(locale.value, { style: 'percent', minimumFractionDigits: 2 }),
  };
}

const perHostname = computed(() => new Map(
  props.modelValue.map(({ host, ...usage }) => [
    `${host.name}_${host.service}`,
    { service: host.service, ...prettyUsage(usage) },
  ]),
));

const total = computed(() => {
  const usageTotal = props.modelValue.reduce(
    (acc, usage) => ({
      name: usage.name,
      available: acc.available + usage.available,
      used: acc.used + usage.used,
      total: acc.total + usage.total,
    }),
    {
      name: '',
      available: 0,
      used: 0,
      total: 0,
    },
  );

  return prettyUsage(usageTotal);
});
</script>
