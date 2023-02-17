<template>
  <v-col v-if="perms.readAll">
    <LoadingToolbar
      :text="$t('title').toString()"
      :loading="loading"
    >
      <RefreshButton
        :loading="loading"
        :tooltip="$t('refresh-tooltip').toString()"
        @click="fetch"
      />
    </LoadingToolbar>

    <v-divider />

    <v-list style="position: relative;">
      <v-list-group
        v-for="item in items"
        :key="item.name"
        v-model="openedCrons[item.name]"
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
                v-if="(perms.start && perms.stop)"
                :input-value="item.isRunning"
                :disabled="loading"
                :label="$t(item.isRunning ? 'item.active' : 'item.inactive')"
                reverse
                class="mr-4"
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
                <span class="ml-1">{{ $t(`cron.${entry.key}`) }}: {{ entry.value }}</span>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </div>

        <v-btn
          v-if="perms.force"
          color="warning"
          :disabled="loading"
          @click="forceCronRun(item)"
        >
          {{ $t('cron.force').toString() }}
        </v-btn>
      </v-list-group>

      <ErrorOverlay v-model="error" />
    </v-list>
  </v-col>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { crons } from 'ezreeport-sdk-js';
import CustomSwitch from '~/components/internal/utils/forms/CustomSwitch';

type CronAction = typeof crons.startCron | typeof crons.stopCron | typeof crons.forceCron;

interface CronDetailItem {
  key: keyof crons.Cron,
  value?: string,
  icon: string,
}

interface CronItem {
  name: string,
  isRunning: boolean,
  detail: CronDetailItem[],
  disabled: boolean,
}

export default defineComponent({
  components: {
    CustomSwitch,
  },
  data: () => ({
    crons: [] as crons.Cron[],
    openedCrons: {} as Record<string, boolean>,

    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        readAll: perms?.['crons-get'],
        readOne: perms?.['crons-get-cron'],

        start: perms?.['crons-put-cron-start'],
        stop: perms?.['crons-put-cron-stop'],
        force: perms?.['crons-post-cron-force'],
      };
    },
    items(): CronItem[] {
      return this.crons.map(this.parseCron);
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      this.fetch();
    },
  },
  mounted() {
    this.fetch();
  },
  methods: {
    /**
     * Fetch all crons and parse result
     */
    async fetch() {
      if (!this.perms.readAll) {
        this.crons = [];
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.crons.getAllCrons();
        this.crons = content;
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Parse cron into a readable format
     *
     * @param cron The cron
     */
    parseCron: (cron: crons.Cron): CronItem => ({
      name: cron.name,
      isRunning: cron.running,
      disabled: !cron.nextRun && !cron.lastRun,
      detail: [
        { key: 'lastRun', icon: 'mdi-calendar-arrow-left', value: cron.lastRun?.toLocaleString() },
        { key: 'nextRun', icon: 'mdi-calendar-arrow-right', value: cron.nextRun?.toLocaleString() },
      ],
    }),
    /**
     * Shorthand to update status (start or stop)
     *
     * @param item The cron
     */
    updateCronStatus(item: CronItem) {
      return this.execCronAction(
        item,
        item.isRunning ? this.$ezReeport.sdk.crons.stopCron : this.$ezReeport.sdk.crons.startCron,
      );
    },
    /**
     * Shorthand to force a cron to run
     *
     * @param item The cron
     */
    forceCronRun(item: CronItem) {
      return this.execCronAction(item, this.$ezReeport.sdk.crons.forceCron);
    },
    /**
     * Execute action on a cron and update the item
     *
     * @param item The crcon
     * @param action The action
     */
    async execCronAction(item: CronItem, action: CronAction) {
      // eslint-disable-next-line no-param-reassign
      this.loading = true;
      try {
        const items = [...this.crons];
        const index = items.findIndex(({ name }) => name === item.name);
        if (index < 0) {
          throw new Error(
            this.$t('cron.not-found', { name: item.name }).toString(),
          );
        }

        const { content } = await action(item.name);

        items.splice(index, 1, content);
        this.crons = items;
      } catch (error) {
        this.error = (error as Error).message;
      }
      // eslint-disable-next-line no-param-reassign
      this.loading = false;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  title: 'Crons'
  refresh-tooltip: 'Refresh cron list'
  cron:
    not-found: 'Cron {name} not found'
    force: 'Force'
    lastRun: 'Last run'
    nextRun: 'Next run'
  item:
    active: 'Active'
    inactive: 'Inactive'
fr:
  title: 'Crons'
  refresh-tooltip: 'Rafraîchir la liste des crons'
  cron:
    not-found: 'Cron {name} non trouvée'
    force: 'Forcer'
    lastRun: 'Dernière itération'
    nextRun: 'Prochaine itération'
  item:
    active: 'Actif'
    inactive: 'Inactif'
</i18n>
