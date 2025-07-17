<template>
  <v-menu :close-on-content-click="false" location="start">
    <template #activator="{ props }">
      <v-list-item
        :title="fsItem.title"
        :subtitle="fsItem.subtitle"
        :prepend-icon="fsItem.prependIcon"
        v-bind="props"
      >
        <template v-if="fsItem.stats.percentage != null" #append>
          <v-progress-circular
            v-tooltip:left="fsItem.tooltip"
            :model-value="fsItem.stats.percentage"
            color="primary"
          />
        </template>
      </v-list-item>
    </template>

    <v-list lines="two" density="compact">
      <v-list-item
        v-for="[hostname, item] in perHostname"
        :key="hostname"
        :title="item.service"
        :subtitle="item.subtitle"
      >
        <template v-if="item.stats.percentage != null" #append>
          <v-progress-circular
            v-tooltip:left="item.tooltip"
            :model-value="item.stats.percentage"
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

const NAME_REGEX = /^(?:\[(?<type>[a-z]+)\] )?(?<name>[a-z]+)$/;

const ICONS: Record<string, string> = {
  database: 'mdi-database',
};

const props = defineProps<{
  modelValue: (FileSystemUsage & { host: { service: string; name: string } })[];
}>();

// oxlint-disable-next-line id-length
const { locale, t } = useI18n();

function usageToItem(usage: FileSystemUsage) {
  const percentage =
    usage.used >= 0 && usage.total >= 0 ? usage.used / usage.total : undefined;
  const percentageStr = percentage?.toLocaleString(locale.value, {
    style: 'percent',
    minimumFractionDigits: 2,
  });

  // Prettify bytes
  const stats = {
    available: prettyBytes(usage.available),
    used: prettyBytes(usage.used),
    total: prettyBytes(usage.total),
    percentage: percentage ? percentage * 100 : undefined,
  };

  // Build subtitle
  const subtitle = [
    usage.total >= 0
      ? t('$ezreeport.health.fsUsage.total', { value: stats.total })
      : 0,
    usage.used >= 0
      ? t('$ezreeport.health.fsUsage.used', { value: stats.used })
      : 0,
    usage.available >= 0
      ? t('$ezreeport.health.fsUsage.available', { value: stats.available })
      : 0,
  ]
    .filter((val) => !!val)
    .join(' | ');

  // Extract title and icon
  let prependIcon;
  let title = usage.name;
  const titleMatches = NAME_REGEX.exec(usage.name)?.groups;
  if (titleMatches) {
    title = titleMatches.name;
    prependIcon = ICONS[titleMatches.type];
  }

  return {
    title,
    subtitle,
    prependIcon,
    tooltip: t('$ezreeport.health.fsUsage%', { value: percentageStr }),
    stats,
  };
}

const perHostname = computed(
  () =>
    new Map(
      props.modelValue.map(({ host, ...usage }) => [
        `${host.name}_${host.service}`,
        {
          service: host.service,
          ...usageToItem(usage),
        },
      ])
    )
);

const fsItem = computed(() => {
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
    }
  );

  return usageToItem(usageTotal);
});
</script>
