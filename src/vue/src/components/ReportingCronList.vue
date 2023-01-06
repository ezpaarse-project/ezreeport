<template>
  <div>
    <LoadingToolbar
      text="Crons"
      :loading="loading"
    >
      <v-btn
        icon
        :disabled="loading || !!mock"
        @click="fetch"
      >
        <v-progress-circular
          v-if="loading"
          size="20"
          width="2"
          indeterminate
        />
        <v-icon v-else>
          mdi-refresh
        </v-icon>
      </v-btn>
    </LoadingToolbar>

    <v-list style="position: relative;">
      <v-list-group
        v-for="item in crons"
        :key="item.name"
        v-model="item.open"
      >
        <template
          v-if="item.disabled"
          #appendIcon
        >
          <div />
        </template>

        <template #activator>
          <v-list-item-content>
            <v-list-item-title class="d-flex align-center">
              <div>{{ item.name }}</div>

              <v-spacer />

              <CustomSwitch
                v-model="item.running"
                :inset="false"
                :disabled="item.loading || loading"
                :label="item.running ? 'Actif' : 'Inactif'"
                :loading="item.loading"
                reverse
                @click.stop="updateCronStatus(item)"
              />
            </v-list-item-title>
          </v-list-item-content>
        </template>

        <div
          v-for="entry in item.detail"
          :key="entry.key"
        >
          <v-list-item
            v-if="entry.value"
            style="min-height: 0px"
          >
            <v-list-item-content class="py-1">
              <v-list-item-subtitle class="d-flex align-center">
                <v-icon small>
                  {{ entry.icon }}
                </v-icon>
                <span class="ml-1">{{ entry.value }}</span>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </div>

        <v-btn
          text
          color="warning"
          :disabled="item.loading || loading"
          :loading="item.loading"
          @click="forceCronRun(item)"
        >
          Forcer
        </v-btn>
      </v-list-group>

      <ErrorOverlay :error="error" />
    </v-list>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { crons } from 'reporting-sdk-js';
import CustomSwitch from './lib/CustomSwitch';

type CronAction = typeof crons.startCron | typeof crons.stopCron | typeof crons.forceCron;

interface CronDetailItem {
  key: keyof crons.Cron,
  value?: string,
  icon: string,
}

interface CronItem {
  name: string,
  running: boolean,
  detail: CronDetailItem[],
  open: boolean,
  disabled: boolean,
  loading: boolean,
}

interface Mock {
  data?: crons.Cron[],
  error?: string,
  loading?: boolean
}

export default defineComponent({
  components: {
    CustomSwitch,
  },
  props: {
    mock: {
      type: Object as PropType<Mock | undefined>,
      default: undefined,
    },
  },
  data: () => ({
    loading: false,
    error: '',
    crons: [] as CronItem[],
  }),
  mounted() {
    if (this.mock) {
      this.crons = (this.mock.data ?? []).map(this.parseCron);
      this.loading = this.mock.loading ?? false;
      this.error = this.mock.error ?? '';
    } else {
      this.fetch();
    }
  },
  methods: {
    async fetch() {
      this.loading = true;
      try {
        const { content } = await crons.getAllCrons();
        this.crons = content.map(this.parseCron);
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    parseCron(cron: crons.Cron): CronItem {
      return {
        open: false,
        loading: false,
        name: cron.name,
        running: cron.running,
        disabled: !cron.nextRun && !cron.lastRun,
        detail: [
          { key: 'lastRun', icon: 'mdi-calendar-arrow-left', value: cron.lastRun?.toLocaleString() },
          { key: 'nextRun', icon: 'mdi-calendar-arrow-right', value: cron.nextRun?.toLocaleString() },
        ],
      };
    },
    updateCronStatus(item: CronItem) {
      return this.execCronAction(item, item.running ? crons.startCron : crons.stopCron);
    },
    forceCronRun(item: CronItem) {
      return this.execCronAction(item, crons.forceCron);
    },
    async execCronAction(item: CronItem, action: CronAction) {
      // eslint-disable-next-line no-param-reassign
      item.loading = true;
      if (!this.mock) {
        try {
          const items = [...this.crons];
          const index = items.findIndex(({ name }) => name === item.name);
          if (index < 0) {
            throw new Error(`Cron "${item.name}" not found`);
          }

          const { content } = await action(item.name);

          const newItem = this.parseCron(content);
          newItem.open = item.open;

          items.splice(index, 1, newItem);
          this.crons = items;
        } catch (error) {
          this.error = (error as Error).message;
        }
      }
      // eslint-disable-next-line no-param-reassign
      item.loading = false;
    },
  },
});
</script>

<style scoped>

</style>
