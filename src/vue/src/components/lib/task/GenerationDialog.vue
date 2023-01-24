<template>
  <v-dialog :value="show" max-width="600">
    <v-card>
      <v-progress-linear
        :active="progress >= 0"
        :value="progress"
        :indeterminate="progress === 0"
      />

      <v-card-title>
        {{ $t('title', { name: task.name }) }}

        <v-spacer />

        <v-btn icon text @click="$emit('update:show', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text style="position: relative">
        <v-slide-y-transition>
          <v-alert v-if="reportStatus" :type="reportStatus" text class="mt-2">
            <div class="d-flex align-center">
              {{ $t('results.' + reportStatus, { error: result?.detail.error?.message }) }}

              <v-spacer />

              <v-menu v-if="perms.getFile">
                <template #activator="{ on, attrs }">
                  <v-btn
                    small
                    :color="reportStatus"
                    v-bind="attrs"
                    v-on="on">
                    {{ $t('actions.download') }}
                  </v-btn>
                </template>

                <v-list>
                  <v-list-item
                    v-if="reportStatus !== 'error'"
                    ripple
                    @click="downloadFile('report')"
                  >
                    <v-icon>mdi-download</v-icon> {{ $t('files.report') }}
                  </v-list-item>
                  <v-list-item
                    ripple
                    @click="downloadFile('detail')"
                  >
                    <v-icon>mdi-download</v-icon> {{ $t('files.detail') }}
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </v-alert>
        </v-slide-y-transition>

        <v-row>
          <v-list three-line flat>
            <v-list-item-group v-model="generationType" mandatory>
              <v-list-item
                v-for="item in options"
                :key="item.value"
                :value="item.value"
                :disabled="progress >= 0"
              >
                <template v-slot:default="{ active }">
                  <v-list-item-action>
                    <v-checkbox off-icon="$radioOff" on-icon="$radioOn" :input-value="active" />
                  </v-list-item-action>

                  <v-list-item-content>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ item.description }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-row>

        <v-slide-y-transition>
          <v-row
            v-if="generationType === 'test'"
          >
            <v-combobox
              v-model="targets"
              :label="$t('headers.targets')"
              :rules="rules"
              multiple
              chips
              deletable-chips
            />
          </v-row>
        </v-slide-y-transition>

        <v-row>
          <v-col>
            <DatePicker
              v-model="periodRange"
              :label="$t('headers.period').toString()"
              :max="max"
            >
              <template #append>
                <v-btn icon @click="resetPeriod">
                  <v-icon>mdi-undo</v-icon>
                </v-btn>
              </template>
            </DatePicker>
          </v-col>
        </v-row>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('update:show', false)" color="error" :disabled="progress >= 0">
          {{ $t('actions.cancel') }}
        </v-btn>

        <v-btn
          :disabled="!perms.runTask && (generationType === 'test' && targets.length <= 0) || progress >= 0"
          color="success"
          @click="start"
        >
          {{ $t('actions.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { addDays, differenceInDays, min } from 'date-fns';
import type { tasks, reports } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import { calcPeriod, type Period } from './recurrence';

const today = new Date();

export default defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    task: {
      type: Object as PropType<tasks.FullTask>,
      required: true,
    },
  },
  emits: {
    // eslint-disable-next-line func-names
    'update:show': function (val: boolean) { return val !== undefined; },
  },
  data: () => ({
    error: '',
    progress: -1,
    generationType: 'test',
    targets: [] as string[],
    result: undefined as reports.ReportResult | undefined,
    job: undefined as reports.GenerationStartedEvent | undefined,
    reportStatus: '' as '' | 'success' | 'error',
    period: { start: today, end: today } as Period,
    max: addDays(today, -1),
  }),
  mounted() {
    this.targets = this.task.targets;
    this.error = '';
    this.resetPeriod();
  },
  computed: {
    options() {
      return [
        { value: 'prod' },
        { value: 'test' },
      ].map((v) => ({
        ...v,
        title: this.$t(`labels.${v.value}`),
        description: this.$t(`descriptions.${v.value}`),
      }));
    },
    rules() {
      return [
        (v: string[]) => v.length > 0 || this.$t('errors.length'),
        // ULTRA Simple email validation
        (v: string[]) => v.every((s) => /[a-z0-9.-]*@[a-z0-9.-]*\.[a-z-]*/i.test(s)) || this.$t('errors.format'),
      ];
    },
    perms() {
      const perms = this.$ezReeport.auth.permissions;
      return {
        runTask: perms?.['tasks-post-task-run'] && perms?.['queues-get-queue-jobId'],
        getFile: perms?.['reports-get-year-yearMonth-filename'] && perms?.['queues-get-queue-jobId'],
      };
    },
    periodRange: {
      get(): [Date, Date] {
        return [this.period.start, this.period.end];
      },
      set(value: [Date]) {
        // Enforcing that the period is compatible with recurrence
        const days = differenceInDays(this.period.end, this.period.start);
        const newPeriod = { start: value[0], end: min([addDays(value[0], days), this.max]) };
        if (differenceInDays(newPeriod.end, newPeriod.start) === days) {
          this.period = newPeriod;
        }
      },
    },
  },
  methods: {
    /**
     * Remove item in target list
     *
     * @param item The item
     */
    remove(item: string) {
      this.targets.splice(this.targets.indexOf(item), 1);
    },
    /**
     * Fetch file
     *
     * @param type The type of file
     */
    async fetchFile(type: 'report' | 'detail' | 'debug'): Promise<{ blob: Blob, fileName: string } | undefined> {
      if (!this.job || !this.result) {
        throw new Error('Job or detail not found');
      }

      let blob: Blob;
      let fileName: string;

      if (type === 'report') {
        blob = await this.$ezReeport.sdk.reports.getReportFileByJob(
          this.job.queue,
          this.job.id,
          undefined,

          'blob',
        );
        fileName = this.result.detail.files.report ?? 'report.pdf';
      } else {
        let content: object;

        if (type === 'detail') {
          content = await this.$ezReeport.sdk.reports.getReportDetailByJob(
            this.job.queue,
            this.job.id,
            undefined,
          );
          fileName = this.result.detail.files.detail ?? 'detail.json';
        } else {
          content = await this.$ezReeport.sdk.reports.getReportDebugByJob(
            this.job.queue,
            this.job.id,
            undefined,
          );
          fileName = this.result.detail.files.debug ?? 'debug.json';
        }

        blob = new Blob([JSON.stringify(content, undefined, 2)], { type: 'application/json' });
      }

      return { blob, fileName: fileName.replace(/^.*\//i, '') };
    },
    /**
     * Download file
     *
     * @param entry The history entry
     * @param type The type of file
     */
    async downloadFile(type: 'report' | 'detail' | 'debug') {
      this.progress = 0;
      try {
        const res = await this.fetchFile(type);
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
      this.progress = -1;
    },
    /**
     * Start generation
     */
    async start() {
      if (
        !this.perms.runTask
        || (this.generationType === 'test' && this.targets.length <= 0)
      ) {
        this.$emit('update:show', false);
        return;
      }

      this.reportStatus = '';
      this.job = undefined;
      this.result = undefined;
      this.progress = 0;
      try {
        // TODO: English translations
        const gen = this.$ezReeport.sdk.reports.startAndListenGeneration(
          this.task.id,
          {
            testEmails: this.generationType === 'test' ? this.targets : undefined,
            period: this.period,
          },
        );

        gen.on('started', (job: reports.GenerationStartedEvent) => {
          this.job = job;
        });

        gen.on('progress', ({ progress }: reports.GenerationProgressEvent) => {
          this.progress = progress * 100;
        });

        this.result = await gen;
        this.reportStatus = this.result.success ? 'success' : 'error';
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.progress = -1;
    },
    /**
     * Calc period based on recurrence
     */
    resetPeriod() {
      this.period = calcPeriod(today, this.task.recurrence);
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  title: 'Generation of "{name}"'
  headers:
    targets: 'Receivers'
    period: 'Report period'
  labels:
    prod: 'labels.prod'
    test: 'labels.test'
  descriptions:
    prod: 'descriptions.prod'
    test: 'descriptions.test'
  errors:
    length: 'Please enter at least 1 address'
    format: "One or more address aren't valid"
  actions:
    ok: 'OK'
    cancel: 'Cancel'
    download: 'Download'
  results:
    success: 'The report was generated with success'
    error: 'An error occured while generating: {error}'
  files:
    detail: 'Detail (JSON)'
    report: 'Report'

fr:
  title: 'Génération de "{name}"'
  headers:
    targets: 'Destinataires'
    period: 'Période du rapport'
  labels:
    prod: 'Génération prod'
    test: 'Génération test'
  descriptions:
    prod: "Le rapport sera envoyé aux destinataires habituels. La génération sera affichée dans l'historique et mettera à jour la date de prochaine itération."
    test: "Le rapport sera envoyé aux destinataires indiqués."
  errors:
    length: 'Veuillez rentrer au moins 1 addresse'
    format: 'Une ou plusieurs addresses ne sont pas valides'
  actions:
    ok: 'Valider'
    cancel: 'Annuler'
    download: 'Télécharger'
  results:
    success: 'Le rapport a été généré avec succès'
    error: 'Une erreur est survenue lors de la génération: {error}'
  files:
    detail: 'Détail (JSON)'
    report: 'Rapport'
</i18n>
