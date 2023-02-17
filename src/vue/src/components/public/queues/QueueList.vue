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
        v-model="openedQueues[item.name]"
      >
        <template #activator>
          <v-list-item-content>
            <v-list-item-title class="d-flex align-center">
              <div>{{ item.name }}</div>

              <v-spacer />

              <CustomSwitch
                v-if="(perms.resume && perms.pause)"
                :input-value="item.isActive"
                :disabled="loading"
                :label="$t(item.isActive ? 'item.active' : 'item.inactive')"
                reverse
                @click.stop="updateQueueStatus(item)"
              />
            </v-list-item-title>
          </v-list-item-content>
        </template>

        <KeepAlive>
          <QueueJobsTable v-if="currentQueue?.name === item.name" :queue="currentQueue.name" />
        </KeepAlive>
      </v-list-group>

      <ErrorOverlay v-model="error" />
    </v-list>
  </v-col>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CustomSwitch from '~/components/internal/utils/forms/CustomSwitch';
import type { queues } from 'ezreeport-sdk-js';

interface QueueItem {
  name: string,
  isActive: boolean,
}

export default defineComponent({
  components: {
    CustomSwitch,
  },
  data: () => ({
    queues: [] as queues.Queue[],
    openedQueues: {} as Record<string, boolean>,

    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        readAll: perms?.['queues-get'],

        resume: perms?.['queues-put-queue-resume'],
        pause: perms?.['queues-put-queue-pause'],
      };
    },
    items(): QueueItem[] {
      return this.queues.map(this.parseQueue);
    },
    currentQueue(): queues.Queue | undefined {
      const openEntry = Object.entries(this.openedQueues).find(([, showed]) => showed);
      if (!openEntry) {
        return undefined;
      }

      return this.queues.find(({ name }) => name === openEntry[0]);
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
        this.queues = [];
        return;
      }

      this.loading = true;
      try {
        const { content } = await this.$ezReeport.sdk.queues.getAllQueues();

        this.queues = content;
        this.error = '';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Parse cron into a readable format
     *
     * @param queue The cron
     */
    parseQueue: (queue: queues.Queue): QueueItem => ({
      name: queue.name,
      isActive: queue.status === 'active',
    }),
    /**
     * Shorthand to update status (start or stop)
     *
     * @param item The queue
     * @param action The action
     */
    async updateQueueStatus(item: QueueItem) {
      // eslint-disable-next-line no-param-reassign
      this.loading = true;
      try {
        const items: queues.Queue[] = [...this.queues];
        const index = items.findIndex(({ name }) => name === item.name);
        if (index < 0) {
          throw new Error(
            this.$t('queue.not-found', { name: item.name }).toString(),
          );
        }

        const action = item.isActive
          ? this.$ezReeport.sdk.queues.pauseQueue
          : this.$ezReeport.sdk.queues.resumeQueue;
        const { content } = await action(item.name);

        items.splice(index, 1, content);
        this.queues = items;
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
  title: 'Queues'
  refresh-tooltip: 'Refresh queue list'
  queue:
    not-found: 'Queue {name} not found'
    force: 'Force'
    lastRun: 'Last run'
    nextRun: 'Next run'
  item:
    active: 'Active'
    inactive: 'Inactive'
fr:
  title: 'Queues'
  refresh-tooltip: 'Rafraîchir la liste des queues'
  queue:
    not-found: 'Cron {name} non trouvée'
    force: 'Forcer'
    lastRun: 'Dernière itération'
    nextRun: 'Prochaine itération'
  item:
    active: 'Actif'
    inactive: 'Inactif'
</i18n>
