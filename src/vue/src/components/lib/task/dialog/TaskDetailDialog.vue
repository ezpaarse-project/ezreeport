<template>
  <div>
    <v-tabs>
      <v-tab>
        {{ $t('tabs.details') }}
      </v-tab>
      <v-tab>
        {{ $t('tabs.template') }}
      </v-tab>
      <v-tab>
        {{ $t('tabs.history') }}
      </v-tab>

      <v-tab-item>
        <!-- Details -->
        <v-row>
          <v-col>
            <div>
              {{ $t('headers.targets') }}:
            </div>
            <div v-if="task">
              <v-chip
                v-for="email in targets"
                :key="email"
                class="ma-2"
                label
                outlined
              >
                <v-avatar left>
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
                {{ email }}
              </v-chip>
            </div>
            <div v-if="(task?.targets.length || 0) > targets.length || !collapsedTargets">
              <v-chip
                label
                :disabled="loading"
                style="width: 100%"
                class="justify-center"
                @click="collapsedTargets = !collapsedTargets"
              >
                <v-icon>
                  {{ collapsedTargets ? 'mdi-chevron-down' : 'mdi-chevron-up' }}
                </v-icon>
                <span>
                  {{
                    $t(
                      collapsedTargets
                        ? 'show-more-tooltip'
                        : 'show-less-tooltip',
                      { count: (task?.targets.length || 0) - targets.length }
                    )
                  }}
                </span>
              </v-chip>
            </div>
          </v-col>

          <v-col>
            <div>{{ $t('headers.institution') }}:</div>
            <InstitutionRichListItem
              v-if="institution"
              :institution="institution"
            />

            <div>{{ $t('headers.dates') }}:</div>
            <v-container>
              <div v-if="task?.lastRun">
                <v-icon small>
                  mdi-calendar-arrow-left
                </v-icon>
                {{ $t('task.lastRun') }}: {{ dates.lastRun }}
              </div>
              <div v-if="task?.nextRun">
                <v-icon small>
                  mdi-calendar-arrow-right
                </v-icon>
                {{ $t('task.nextRun') }}: {{ dates.nextRun }}
              </div>
            </v-container>
          </v-col>
        </v-row>
      </v-tab-item>

      <v-tab-item>
        <!-- Template -->
        <pre v-if="task">
{{ JSON.stringify(task.template, undefined, 2) }}
            </pre>
      </v-tab-item>

      <v-tab-item>
        <!-- History -->
        <InternalHistoryTable
          v-if="task"
          :history="task.history"
          hide-task
          hide-institution
        />
      </v-tab-item>
    </v-tabs>

    <ErrorOverlay :error="error" />
  </div>
</template>

<script lang="ts">
import type { institutions, tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';

const MAX_TARGETS = 2;

export default defineComponent({
  props: {
    task: {
      type: Object as PropType<tasks.FullTask | undefined>,
      default: undefined,
    },
  },
  emits: {
    // created(id: string) { return !!id },
  },
  data: () => ({
    mode: 'view',
    institution: undefined as institutions.Institution | undefined,
    collapsedTargets: true,
    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        create: perms?.['crons-get-cron'],
        readOne: perms?.['tasks-get-task'],
        update: perms?.['tasks-put-task'],
        delete: perms?.['tasks-delete-task'],

        readInstitutions: perms?.['auth-get-institutions'],

        createFile: perms?.['tasks-post-task-run'],
        readFile: perms?.['reports-get-year-yearMonth-filename'],
      };
    },
    targets(): string[] {
      if (!this.task) return [];

      const targets = [...this.task.targets];
      if (this.collapsedTargets && targets.length > MAX_TARGETS) {
        targets.length = MAX_TARGETS;
      }
      return targets;
    },
    dates(): { nextRun?: string, lastRun?: string } {
      return {
        nextRun: this.task?.enabled ? this.task.nextRun.toLocaleDateString() : undefined,
        lastRun: this.task?.lastRun?.toLocaleString(),
      };
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.auth.permissions': function () {
      if (this.perms.readOne) {
        this.fetch();
      } else {
        this.institution = undefined;
      }
    },
    task() {
      if (this.perms.readOne) {
        this.fetch();
        this.collapsedTargets = true;
      } else {
        this.institution = undefined;
      }
    },
  },
  methods: {
    /**
     * Fetch task's institution info
     */
    async fetch() {
      if (this.task) {
        this.loading = true;
        try {
          this.institution = this.$ezReeport.institutions.data
            .find(({ id }) => id === this.task?.institution);
          this.error = '';
        } catch (error) {
          this.error = (error as Error).message;
        }
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
messages:
  en:
    show-more-tooltip: Show {count} more
    show-less-tooltip: Show less
    headers:
      institution: Institution
      targets: Receivers
      dates: Dates
    tabs:
      details: Details
      template: Template
      history: History
    actions:
      generate: Generate
      edit: Edit
      delete: Delete
    task:
      lastRun: Last run
      nextRun: Next run

  fr:
    show-more-tooltip: Afficher plus ({count})
    show-less-tooltip: Afficher moins
    headers:
      institution: Institution
      targets: Destinataires
      dates: Dates
    tabs:
      details: Détails
      template: Modèle
      history: Historique
    actions:
      generate: Générer
      edit: Éditer
      delete: Supprimer
    task:
      lastRun: Dernière itération
      nextRun: Prochaine itération

</i18n>
