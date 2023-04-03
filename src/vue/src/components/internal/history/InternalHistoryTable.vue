<template>
  <div style="position: relative">
    <TaskDialogRead
      v-if="perms.readOneTask"
      v-model="readTaskDialogShown"
      :id="focusedId"
    />

    <ErrorOverlay v-model="error" />

    <v-data-table
      :headers="headers"
      :items="items"
      :loading="loading"
      :options="options"
      item-key="id"
      hide-default-footer
      @update:options="$emit('update:options', $event)"
    >
      <template #[`item.type`]="{ value: type, item }">
        <!-- Status of entry + actions on linked files -->
        <div class="text-center">
          <v-menu :disabled="!perms.readFile || !item.files">
            <template #activator="{ on, attrs }">
              <v-chip
                :color="type.color"
                :outlined="!perms.readFile || !item.files"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon
                  v-if="item.files"
                  small
                  class="mr-1"
                >
                  {{ type.icon }}
                </v-icon>
                {{ type.text }}
              </v-chip>
            </template>

            <v-list>
              <v-list-item
                v-if="item.files?.report"
                ripple
                @click="downloadFile(item, 'report')"
              >
                <v-icon>mdi-download</v-icon> {{ $t('files.report') }}
              </v-list-item>
              <v-list-item
                v-if="item.files?.detail"
                ripple
                @click="downloadFile(item, 'detail')"
              >
                <v-icon>mdi-download</v-icon> {{ $t('files.detail') }}
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>

      <template #[`item.task`]="{ value: task }">
        <div class="text-center">
          <template v-if="task">
            <a
              v-if="$ezReeport.data.auth.permissions?.namespaces[task.namespace?.id ?? '']?.['tasks-get-task']"
              href="#"
              @click.prevent="showTaskDialog(task.id)"
            >
              {{ task.name }}
            </a>
            <span v-else>{{ task.name }}</span>
          </template>

          <v-progress-circular v-else indeterminate class="my-2" />
        </div>
      </template>

      <template #[`item.namespace`]="{ value: namespace }">
        <NamespaceRichListItem
          v-if="namespace"
          :namespace="namespace"
        />
        <v-progress-circular v-else indeterminate class="my-2" />
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { isBefore, parseISO } from 'date-fns';
import type { history, namespaces, tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import type { DataOptions } from 'vuetify';
import type { DataTableHeader } from '~/types/vuetify';
import ezReeportMixin from '~/mixins/ezr';

type AnyHistory = history.History | history.HistoryWithTask;

interface HistoryItem {
  id: string,
  type: {
    text: string,
    icon?: string,
    color?: string,
  },
  message: string,
  date: string,
  task?: history.HistoryWithTask['task'],
  namespace?: namespaces.Namespace,
  files?: {
    report?: string,
    detail?: string,
    debug?: string,
  }
}

const today = new Date();

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    history: {
      type: Array as PropType<AnyHistory[]>,
      required: true,
    },
    hideTask: {
      type: Boolean,
      default: false,
    },
    hideNamespace: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Object as PropType<DataOptions>,
      default: (): Partial<DataOptions> => ({
        sortBy: ['date'],
        sortDesc: [true],
        itemsPerPage: -1,
      }),
    },
  },
  emits: {
    'update:options': (val: DataOptions) => !!val,
  },
  data: () => ({
    readTaskDialogShown: false,

    focusedId: '',

    loading: false,
    error: '',
  }),
  computed: {
    /**
     * User permissions
     */
    perms() {
      const has = this.$ezReeport.hasNamespacedPermission;
      return {
        readFile: has('reports-get-year-yearMonth-filename', []),
        readOneTask: has('tasks-get-task', []),
      };
    },
    /**
     * Data table headers
     */
    headers(): DataTableHeader<HistoryItem>[] {
      const headers: DataTableHeader<HistoryItem>[] = [
        {
          value: 'type',
          text: this.$t('headers.type').toString(),
          sortable: false,
        },
        {
          value: 'message',
          text: this.$t('headers.message').toString(),
          sortable: false,
        },
        {
          value: 'date',
          text: this.$t('headers.date').toString(),
        },
      ];
      if (!this.hideNamespace && this.perms.readOneTask) {
        headers.splice(1, 0, {
          value: 'namespace',
          text: this.$ezReeport.tcNamespace(true),
          sort: (a?: namespaces.Namespace, b?: namespaces.Namespace) => (a?.name ?? '').localeCompare(b?.name ?? ''),
        });
      }
      if (!this.hideTask && this.perms.readOneTask) {
        headers.splice(1, 0, {
          value: 'task',
          text: this.$t('headers.task').toString(),
          sort: (a?: tasks.Task, b?: tasks.Task) => (a?.name ?? '').localeCompare(b?.name ?? ''),
        });
      }
      return headers;
    },
    /**
     * Data table items
     */
    items(): HistoryItem[] {
      return this.history.map(this.parseHistory);
    },
  },
  methods: {
    /**
     * Parse history entry into a human readable format
     *
     * @param entry The history entry
     */
    parseHistory(entry: AnyHistory) {
      const type: HistoryItem['type'] = { text: entry.type };
      switch (entry.type) {
        case 'generation-success':
          type.icon = 'mdi-file-outline';
          type.text = 'success';
          type.color = 'success';
          break;
        case 'creation':
          type.color = 'success';
          break;
        case 'edition':
          type.color = 'info';
          break;
        case 'generation-error':
          type.icon = 'mdi-file-outline';
          type.text = 'error';
          type.color = 'error';
          break;
        default:
          break;
      }

      let task: history.HistoryWithTask['task'] | undefined;
      let namespace: namespaces.Namespace | undefined;
      if ('task' in entry) {
        task = entry.task;
        namespace = this.$ezReeport.data.namespaces.data
          .find(({ id }) => id === entry.task.namespace.id);
      }

      const data = entry.data as any | undefined;
      return {
        id: entry.id,
        type,
        message: entry.message,
        date: entry.createdAt.toLocaleDateString(),
        task,
        namespace,
        files: (!data?.destroyAt || isBefore(today, parseISO(data.destroyAt))) && data?.files,
      };
    },
    /**
     * Fetch file linked to an history entry
     *
     * @param entry The history entry
     * @param type The type of file
     */
    async fetchFile(
      item: HistoryItem,
      type: keyof Required<HistoryItem>['files'],
    ): Promise<{ blob: Blob, fileName: string } | undefined> {
      const entry = this.history.find(({ id }) => id === item.id);
      // Check if file is linked
      if (!entry || !item.files?.[type]) {
        return undefined;
      }

      let blob: Blob;
      const fileName = (item.files[type] ?? '').replace(/\.[a-z]{3}\.json$/gi, '');
      if (type === 'report') {
        blob = await this.$ezReeport.sdk.reports.getReportFileByName(fileName, undefined, 'blob');
      } else {
        let content: object;

        if (type === 'detail') {
          content = await this.$ezReeport.sdk.reports.getReportDetailByName(fileName);
        } else {
          content = await this.$ezReeport.sdk.reports.getReportDebugByName(fileName);
        }

        blob = new Blob([JSON.stringify(content, undefined, 2)], { type: 'application/json' });
      }

      return { blob, fileName: item.files[type] ?? '' };
    },
    /**
     * Download file linked to an history entry
     *
     * @param entry The history entry
     * @param type The type of file
     */
    async downloadFile(item: HistoryItem, type: 'report' | 'detail' | 'debug') {
      this.loading = true;
      try {
        const res = await this.fetchFile(item, type);
        if (!res) {
          return;
        }

        const el = document.createElement('a');
        el.href = URL.createObjectURL(res.blob);
        el.download = res.fileName;
        el.click();
        URL.revokeObjectURL(el.href);
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    /**
     * Prepare and show task dialog
     *
     * @param id The id of the task
     */
    showTaskDialog(id: string) {
      this.focusedId = id;
      this.readTaskDialogShown = true;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    type: 'Type'
    message: 'Message'
    date: 'Date'
    task: 'Task'
  files:
    detail: 'Detail (JSON)'
    report: 'Report'
fr:
  headers:
    type: 'Type'
    message: 'Message'
    date: 'Date'
    task: 'Tâche'
  files:
    detail: 'Détail (JSON)'
    report: 'Rapport'
</i18n>
