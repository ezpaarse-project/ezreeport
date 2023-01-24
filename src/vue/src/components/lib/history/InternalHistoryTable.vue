<template>
  <div style="position: relative">
    <TaskDialog
      :id="focusedTask"
      :show.sync="shownTaskDialog"
    />

    <ErrorOverlay v-model="error" />

    <v-data-table
      :headers="headers"
      :items="items"
      sort-by="date"
      sort-desc
      item-key="id"
      :loading="loading"
      hide-default-footer
    >
      <template #[`item.type`]="{ value: type, item }">
        <!-- Status of entry + actions on linked files -->
        <div class="text-center">
          <v-menu :disabled="!perms.readFile || !type.icon">
            <template #activator="{ on, attrs }">
              <v-chip
                :color="type.color"
                :outlined="!perms.readFile || !type.icon"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon
                  v-if="type.icon"
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
                v-if="type.color !== 'error'"
                ripple
                @click="downloadFile(item, 'report')"
              >
                <v-icon>mdi-download</v-icon> {{ $t('files.report') }}
              </v-list-item>
              <v-list-item
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
          <a
            v-if="task"
            href="#"
            @click.prevent="showTaskDialog(task.id)"
          >
            {{ task.name }}
          </a>
          <span v-else>...</span>
        </div>
      </template>

      <template #[`item.institution`]="{ value: institution }">
        <InstitutionRichListItem
          v-if="institution"
          :institution="institution"
        />
        <span v-else>...</span>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import type { history, institutions } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import type { DataTableHeader } from '~/types/vuetify';

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
  institution?: institutions.Institution,
}

export default defineComponent({
  props: {
    history: {
      type: Array as PropType<AnyHistory[]>,
      required: true,
    },
    hideTask: {
      type: Boolean,
      default: false,
    },
    hideInstitution: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    focusedTask: '',
    shownTaskDialog: false,
    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        readFile: perms?.['reports-get-year-yearMonth-filename'],
        readOneTask: perms?.['tasks-get-task'],
      };
    },
    headers(): DataTableHeader<HistoryItem>[] {
      const headers: DataTableHeader<HistoryItem>[] = [
        {
          value: 'type',
          text: this.$t('headers.type').toString(),
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
      if (!this.hideInstitution && this.perms.readOneTask) {
        headers.splice(1, 0, {
          value: 'institution',
          text: this.$t('headers.institution').toString(),
        });
      }
      if (!this.hideTask && this.perms.readOneTask) {
        headers.splice(1, 0, {
          value: 'task',
          text: this.$t('headers.task').toString(),
        });
      }
      return headers;
    },
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
      let institution: institutions.Institution | undefined;
      if ('task' in entry) {
        task = entry.task;
        institution = this.$ezReeport.institutions.data
          .find(({ id }) => id === entry.task.institution);
      }

      return {
        id: entry.id,
        type,
        message: entry.message,
        date: entry.createdAt.toLocaleDateString(),
        task,
        institution,
      };
    },
    /**
     * Fetch file linked to an history entry
     *
     * @param entry The history entry
     * @param type The type of file
     */
    async fetchFile(id: HistoryItem['id'], type: 'report' | 'detail' | 'debug'): Promise<{ blob: Blob, fileName: string } | undefined> {
      // TODO: Add file & if deleted in `data`
      const entry = this.history.find((e) => e.id === id);
      // Check if file is linked
      if (!entry || !/^generation-.*/i.test(entry.type)) {
        return undefined;
      }
      const matches = /rapport "(?<filepath>.*)"/i.exec(entry.message);
      if (!matches?.groups?.filepath) {
        return undefined;
      }
      const filePath = matches?.groups?.filepath;
      let blob: Blob;
      let fileName: string = filePath.replace(/^.*\//i, '');

      if (type === 'report') {
        blob = await this.$ezReeport.sdk.reports.getReportFileByName(filePath, undefined, 'blob');
        fileName += '.rep.pdf';
      } else {
        let content: object;

        if (type === 'detail') {
          content = await this.$ezReeport.sdk.reports.getReportDetailByName(filePath);
          fileName += '.det';
        } else {
          content = await this.$ezReeport.sdk.reports.getReportDebugByName(filePath);
          fileName += '.deb';
        }

        blob = new Blob([JSON.stringify(content, undefined, 2)], { type: 'application/json' });
        fileName += '.json';
      }

      return { blob, fileName };
    },
    /**
     * Download file linked to an history entry
     *
     * @param entry The history entry
     * @param type The type of file
     */
    async downloadFile({ id }: HistoryItem, type: 'report' | 'detail' | 'debug') {
      this.loading = true;
      try {
        const res = await this.fetchFile(id, type);
        if (!res) {
          return;
        }

        const el = document.createElement('a');
        el.href = URL.createObjectURL(res.blob);
        el.download = res.fileName;
        el.click();
        URL.revokeObjectURL(el.href);
      } catch (error) {
        console.error('Error catch', error);

        this.error = (error as Error).message;
      }
      this.loading = false;
    },
    showTaskDialog(id: string) {
      this.focusedTask = id;
      this.shownTaskDialog = true;
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
    institution: 'Institution'
  files:
    detail: 'Detail (JSON)'
    report: 'Report'
fr:
  headers:
    type: 'Type'
    message: 'Message'
    date: 'Date'
    task: 'Tâche'
    institution: 'Établissement'
  files:
    detail: 'Détail (JSON)'
    report: 'Rapport'
</i18n>
