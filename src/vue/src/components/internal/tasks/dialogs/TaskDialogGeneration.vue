<template>
  <v-dialog
    :value="value"
    max-width="600"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-progress-linear
        :active="progress >= 0"
        :value="progress"
        :indeterminate="progress === 0"
      />

      <v-card-title>
        {{ $t('title', { name: task.name }) }}

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text style="position: relative">
        <v-slide-y-transition>
          <v-alert v-if="reportStatus" :type="reportStatus" text class="mt-2">
            <div>
              <div :class="[result?.detail.error && 'text-decoration-underline']">{{ $t(`results.${reportStatus}`) }}</div>
              <div v-if="result?.detail.error">
                <i18n v-if="result.detail.error.cause" path="error_details.layout" tag="span">
                  <template #type>
                    {{
                      result.detail.error.cause.type !== 'unknown'
                        ? $t(`error_types.${result.detail.error.cause.type}`)
                        : $t('$ezreeport.unknown')
                    }}
                  </template>

                  <template #layout>
                    <span class="font-weight-bold">
                      {{
                        result.detail.error.cause.layout >= 0
                          ? result.detail.error.cause.layout + 1
                          : $t('$ezreeport.unknown')
                      }}
                    </span>
                  </template>
                </i18n>
                <i18n v-if="result.detail.error.cause?.figure != null" path="error_details.figure" tag="span" class="ml-1">
                  <template #figure>
                    <span class="font-weight-bold">
                      {{
                        result.detail.error.cause.figure >= 0
                          ? result.detail.error.cause.figure + 1
                          : $t('$ezreeport.unknown')
                      }}
                    </span>
                  </template>
                </i18n>
                <i18n path="error_details.message" tag="span" class="ml-1">
                  <template #message>
                    <div>
                      <code>{{ result.detail.error.message }}</code>
                    </div>
                  </template>
                </i18n>
              </div>
            </div>

            <v-menu v-if="perms.getFile">
              <template #activator="{ on, attrs }">
                <v-btn
                  :color="reportStatus"
                  small
                  block
                  class="mt-2"
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
          </v-alert>
        </v-slide-y-transition>

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

        <v-slide-y-transition>
          <template
            v-if="generationType === 'test'"
          >
            <v-combobox
              v-model="targets"
              :label="$t('headers.targets')"
              :rules="rules.targets"
              multiple
              outlined
            >
              <template #append>
                <div />
              </template>

              <template v-slot:selection="data">
                <v-chip
                  :key="data.item"
                  :input-value="data.selected"
                  :disabled="data.disabled"
                  :color="!validateMail(data.item) ? 'error' : undefined"
                  small
                  close
                  @click:close="data.parent.selectItem(data.item)"
                  v-bind="data.attrs"
                >
                  {{ data.item }}
                </v-chip>
              </template>
            </v-combobox>
          </template>
        </v-slide-y-transition>

        <DatePicker
          v-model="periodRange"
          :label="$t('headers.period').toString()"
          :max="max"
          outlined
        >
          <template #append>
            <v-btn icon @click="resetPeriod">
              <v-icon>mdi-undo</v-icon>
            </v-btn>
          </template>
        </DatePicker>

        <ErrorOverlay v-model="error" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn @click="$emit('input', false)" :disabled="progress >= 0">
          {{ $t('actions.cancel') }}
        </v-btn>

        <v-btn
          v-if="perms.runTask"
          :disabled="generationType === 'test' && targets.length <= 0"
          :loading="progress >= 0"
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
import {
  addDays,
  differenceInDays,
  formatISO,
  parseISO,
} from 'date-fns';
import type { tasks, reports } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import isEmail from 'validator/lib/isEmail';
import { calcPeriodByRecurrence, calcPeriodByDate, type Period } from '~/lib/tasks/recurrence';
import ezReeportMixin from '~/mixins/ezr';

const today = new Date();
const maxDate = addDays(today, -1);

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    task: {
      type: Object as PropType<Omit<tasks.FullTask, 'template'>>,
      required: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    generated: (value: boolean) => value !== undefined,
  },
  data: () => ({
    generationType: 'test',
    targets: [] as string[],
    result: undefined as reports.ReportResult | undefined,
    job: undefined as reports.GenerationStartedEvent | undefined,
    reportStatus: '' as '' | 'success' | 'error',
    period: { start: today, end: today } as Period,
    max: maxDate,

    progress: -1,
    error: '',
  }),
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
      return {
        targets: [
          (v: string[]) => v.length > 0 || this.$t('errors.length'),
          (v: string[]) => v.every(this.validateMail) || this.$t('errors.format'),
        ],
      };
    },
    perms() {
      const has = this.$ezReeport.hasNamespacedPermission;
      const namespaces = [this.task.namespace.id];
      return {
        runTask: has('tasks-post-task-run', namespaces)
          && has('queues-get-queue-jobs-jobId', namespaces),

        getFile: has('reports-get-year-yearMonth-filename', namespaces)
          && has('queues-get-queue-jobs-jobId', namespaces),
      };
    },
    periodRange: {
      get(): [Date, Date] {
        return [this.period.start, this.period.end];
      },
      set(value: [Date]) {
        const period = calcPeriodByDate(
          this.$ezReeport.sdk.tasks.Recurrence,
          value[0],
          this.task.recurrence,
        );

        if (differenceInDays(this.max, period.end) >= 0) {
          this.period = period;
        }
      },
    },
  },
  watch: {
    value(val: boolean) {
      if (val) {
        this.resetPeriod();
      }
    },
  },
  mounted() {
    this.targets = this.task.targets;
    this.error = '';
    this.resetPeriod();
  },
  methods: {
    /**
     * Check if given string is a mail address
     *
     * @param email The string
     */
    validateMail: (email: string) => isEmail(email),
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
        this.$emit('input', false);
        return;
      }

      this.reportStatus = '';
      this.job = undefined;
      this.result = undefined;
      this.progress = 0;
      try {
        const periodStart = formatISO(this.period.start, { representation: 'date' });
        const periodEnd = formatISO(this.period.end, { representation: 'date' });

        const gen = this.$ezReeport.sdk.reports.startAndListenGeneration(
          this.task.id,
          {
            testEmails: this.generationType === 'test' ? this.targets : undefined,
            period: {
              start: parseISO(`${periodStart}T00:00:00.000Z`),
              end: parseISO(`${periodEnd}T23:59:59.999Z`),
            },
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
        this.$emit('generated', true);
      } catch (error) {
        this.error = (error as Error).message;
      }
      this.progress = -1;
    },
    /**
     * Calc period based on recurrence
     */
    resetPeriod() {
      this.period = calcPeriodByRecurrence(
        this.$ezReeport.sdk.tasks.Recurrence,
        today,
        this.task.recurrence,
      );
    },
  },
});
</script>

<style lang="scss" scoped>

</style>

<i18n lang="yaml">
en:
  title: 'Generation of "{name}"'
  headers:
    targets: 'Receivers'
    period: 'Report period'
  labels:
    prod: 'Normal generation'
    test: 'Test generation'
  descriptions:
    prod: 'The report will be sent to the usual recipients. The generation will be displayed in the activity and will update the next iteration date.'
    test: 'The report will be sent to the indicated recipients.'
  errors:
    length: 'Please enter at least 1 address'
    format: "One or more address aren't valid"
  actions:
    ok: 'OK'
    cancel: 'Cancel'
    download: 'Download'
  results:
    success: 'The report was generated with success'
    error: 'An error occurred during generation:'
  error_types:
    fetch: 'retrieving data from'
    render: 'rendering'
  error_details:
    layout: 'Was {type} page {layout}.'
    figure: 'More precisely, it occurred on a figure {figure}.'
    message: 'Then occurred: {message}.'
  files:
    detail: 'Detail (JSON)'
    report: 'Report'

fr:
  title: 'Génération de "{name}"'
  headers:
    targets: 'Destinataires'
    period: 'Période du rapport'
  labels:
    prod: 'Génération normale'
    test: 'Génération test'
  descriptions:
    prod: "Le rapport sera envoyé aux destinataires habituels. La génération sera affichée dans l'activité et mettra à jour la date de prochaine itération."
    test: "Le rapport sera envoyé aux destinataires indiqués."
  errors:
    length: 'Veuillez rentrer au moins 1 adresse'
    format: 'Une ou plusieurs addresses ne sont pas valides'
  actions:
    ok: 'Valider'
    cancel: 'Annuler'
    download: 'Télécharger'
  results:
    success: 'Le rapport a été généré avec succès'
    error: 'Une erreur est survenue lors de la génération:'
  error_types:
    fetch: 'récupérer les données de'
    render: 'rendre'
  error_details:
    layout: 'Était en train de {type} la page {layout}.'
    figure: "Plus précisément, c'est arrivé sur la visualisation {figure}."
    message: 'Est alors survenu: {message}'
  files:
    detail: 'Détail (JSON)'
    report: 'Rapport'
</i18n>
