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
  import type { FileSystemUsage } from '~sdk/health';
  import { mdiDatabase } from '@mdi/js';
  import prettyBytes from 'pretty-bytes';

  const NAME_REGEX = /^(?:\[(?<type>[a-z]+)\] )?(?<name>[a-z]+)$/;

  const ICONS: Record<string, string> = {
    database: mdiDatabase,
  };

  const props = defineProps<{
    modelValue: (FileSystemUsage & { host: { service: string; name: string } })[];
  }>();

  const { locale, t } = useI18n();

  function usageToItem(usage: FileSystemUsage) {
    const percentage =
      usage.used >= 0 && usage.total >= 0 ? usage.used / usage.total : undefined;
    const percentageStr = percentage?.toLocaleString(locale.value, {
      minimumFractionDigits: 2,
      style: 'percent',
    });

    // Prettify bytes
    const stats = {
      available: prettyBytes(usage.available),
      percentage: percentage ? percentage * 100 : undefined,
      total: prettyBytes(usage.total),
      used: prettyBytes(usage.used),
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
      .filter((val) => Boolean(val))
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
      prependIcon,
      stats,
      subtitle,
      title,
      tooltip: t('$ezreeport.health.fsUsage%', { value: percentageStr }),
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
    const usageTotal = {
      available: 0,
      name: '',
      total: 0,
      used: 0,
    };

    for (const usage of props.modelValue) {
      usageTotal.available += usage.available;
      usageTotal.name += usage.name;
      usageTotal.total += usage.total;
      usageTotal.used += usage.used;
    }

    return usageToItem(usageTotal);
  });
</script>
