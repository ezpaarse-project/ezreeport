<template>
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
      <div class="text-center">
        <v-chip
          :color="type.color"
          :outlined="perms.readFile"
          @click="downloadFile(item)"
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
        <!-- todo: menu to choose between detail & report -->
      </div>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import type { history } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import type { DataTableHeader } from '../../types/vuetify';

interface HistoryItem {
  id: string,
  type: {
    text: string,
    icon?: string,
    color?: string,
  },
  message: string,
  date: string,
}

export default defineComponent({
  props: {
    history: {
      type: Array as PropType<history.History[]>,
      required: true,
    },
  },
  data: () => ({
    loading: false,
    error: '', // TODO
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.auth_permissions;
      return {
        readFile: perms?.['reports-get-year-yearMonth-filename'],
      };
    },
    headers(): DataTableHeader<HistoryItem>[] {
      return [
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
    },
    items(): HistoryItem[] {
      return this.history
        .map((entry) => {
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

          return {
            id: entry.id,
            type,
            message: entry.message,
            date: entry.createdAt.toLocaleDateString(),
          };
        });
    },
  },
  methods: {
    /**
     * Open file linked to an history entry
     *
     * TODO: Add file in `data`
     *
     * @param entry The history entry
     * @param type The type of file
     */
    async downloadFile({ id }: HistoryItem, type: 'report' | 'detail' = 'report') {
      if (!this.perms.readFile) {
        return;
      }

      const entry = this.history.find((e) => e.id === id);

      // Check if file is linked
      if (!entry || !/^generation-.*/i.test(entry.type)) {
        return;
      }

      const matches = /rapport "(?<filepath>.*)"/i.exec(entry.message);
      if (!matches?.groups?.filepath) {
        return;
      }

      const filepath = matches?.groups?.filepath;
      this.loading = true;
      try {
        if (type === 'detail') {
          const file = await this.$ezReeport.reports.getReportDetailByName(filepath);
          console.log(file);
          // TODO
        } else {
          const file = await this.$ezReeport.reports.getReportFileByName(filepath);
          // const b64 = atob(file);
          // console.log(b64);
          // TODO
        }
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.loading = false;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
messages:
  en:
    headers:
      type: Type
      message: Message
      date: Date
  fr:
    headers:
      type: Type
      message: Message
      date: Date
</i18n>
