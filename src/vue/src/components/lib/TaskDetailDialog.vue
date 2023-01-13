<template>
  <v-dialog
    v-if="perms.readOne && perms.readInstitutions"
    :value="show"
    width="850"
    scrollable
    @input="$emit('update:show', $event)"
  >
    <v-card
      :loading="loading"
    >
      <v-card-title>
        <div>
          {{ task?.name }}
          <RecurrenceChip
            v-if="task"
            size="small"
            class="text-body-2 ml-2"
            :value="task.recurrence"
          />
        </div>

        <v-spacer />

        <CustomSwitch
          v-if="task"
          :input-value="task.enabled"
          :label="$t(task?.enabled ? 'item.active' : 'item.inactive')"
          class="text-body-2"
          reverse
        />

        <RefreshButton
          :loading="loading"
          :tooltip="$t('refresh-tooltip').toString()"
          @click="fetch"
        />
        <v-btn
          icon
          text
          @click="$emit('update:show', false)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text style="position: relative">
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
                    outlined
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
            />
          </v-tab-item>
        </v-tabs>

        <ErrorOverlay :error="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          text
          color="warning"
        >
          {{ $t('actions.generate') }}
        </v-btn>

        <v-btn
          v-if="perms.update"
          text
          color="info"
        >
          {{ $t('actions.edit') }}
        </v-btn>

        <v-btn
          v-if="perms.delete"
          text
          color="error"
        >
          {{ $t('actions.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { auth, tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import CustomSwitch from '../common/CustomSwitch';

const MAX_TARGETS = 2;

export default defineComponent({
  components: { CustomSwitch },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    initialMode: {
      type: String as PropType<'view' | 'edit' | 'create'>,
      default: 'view',
    },
    id: {
      type: String,
      default: '',
    },
  },
  data: () => ({
    mode: 'view',
    task: undefined as tasks.FullTask | undefined,
    institution: undefined as auth.Institution | undefined,
    collapsedTargets: true,
    loading: false,
    error: '',
  }),
  computed: {
    perms() {
      const perms = this.$ezReeport.auth_permissions;
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
    '$ezReeport.auth_permissions': function () {
      if (this.perms.readOne) {
        this.fetch();
      } else {
        this.task = undefined;
      }
    },
    id() {
      if (this.perms.readOne) {
        this.fetch();
        this.collapsedTargets = true;
      } else {
        this.task = undefined;
      }
    },
  },
  mounted() {
    this.mode = this.initialMode;
  },
  methods: {
    /**
     * Fetch task info
     */
    async fetch() {
      if (this.id) {
        this.loading = true;
        try {
          const { content } = await this.$ezReeport.tasks.getTask(this.id);
          this.task = content;

          const { content: { available } } = await this.$ezReeport.auth.getInstitutions();
          this.institution = available.find(({ id }) => id === content.institution);
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
    refresh-tooltip: Refresh task
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
    item:
      active: Active
      inactive: Inactive

  fr:
    refresh-tooltip: Rafraichir la tâche
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
    item:
      active: Actif
      inactive: Inactif

</i18n>
