<template>
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
                collapsedTargets ? 'show-more' : 'show-less',
                { count: (task?.targets.length || 0) - targets.length },
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
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    collapsedTargets: true,
    error: '',
  }),
  computed: {
    institution(): institutions.Institution | undefined {
      return this.$ezReeport.institutions.data.find(({ id }) => id === this.task?.institution);
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
      this.fetchInstitutions();
    },
  },
  mounted() {
    this.fetchInstitutions();
  },
  methods: {
    async fetchInstitutions() {
      try {
        this.$ezReeport.institutions.fetch();
      } catch (error) {
        this.error = (error as Error).message;
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  show-more: 'Show {count} more'
  show-less: 'Show less'
  headers:
    institution: 'Institution'
    targets: 'Receivers'
    dates: 'Dates'
  tabs:
    details: 'Details'
    template: 'Template'
    history: 'History'
  actions:
    generate: 'Generate'
    edit: 'Edit'
    delete: 'Delete'
  task:
    lastRun: 'Last run'
    nextRun: 'Next run'

fr:
  show-more: 'Afficher plus ({count})'
  show-less: 'Afficher moins'
  headers:
    institution: 'Institution'
    targets: 'Destinataires'
    dates: 'Dates'
  tabs:
    details: 'Détails'
    template: 'Modèle'
    history: 'Historique'
  actions:
    generate: 'Générer'
    edit: 'Éditer'
    delete: 'Supprimer'
  task:
    lastRun: 'Dernière itération'
    nextRun: 'Prochaine itération'
</i18n>
