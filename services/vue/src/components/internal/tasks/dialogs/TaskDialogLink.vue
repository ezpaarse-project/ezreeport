<template>
  <v-dialog v-if="shown" v-model="shown" :persistent="loading" max-width="500">
    <v-card>
      <v-card-title>{{ $t(`${i18nPrefix}.title`) }}</v-card-title>

      <v-card-text>
        <!-- Alert if error -->
        <v-alert v-if="error" :value="!!error" text type="error">
          <div class="text-decoration-underline">{{ $t('error.title') }}</div>

          <i18n :path="`error.description._template`" tag="div">
            <template #intro>
              {{ $t(`error.description.intro`) }}
            </template>

            <template #question>
              <strong>{{ $t(`error.description.question`) }}</strong>
            </template>

            <template #advice>
              {{ $t(`error.description.advice`) }}
            </template>
          </i18n>

          <div class="mt-2">
            <code>{{ error }}</code>
          </div>
        </v-alert>

        <!-- Confirmation -->
        <i18n :path="`${i18nPrefix}.description._template`" tag="p">
          <template #intro>
            {{ $t(`${i18nPrefix}.description.intro`) }}
          </template>

          <template #warn>
            <strong>{{ $t(`${i18nPrefix}.description.warn`) }}</strong>
          </template>

          <template #advice>
            {{ $t(`${i18nPrefix}.description.advice`) }}
          </template>
        </i18n>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions>
        <v-spacer />

        <v-btn :loading="loading" @click="shown = false">
          {{ $t('$ezreeport.cancel') }}
        </v-btn>

        <v-btn v-if="!error" :disabled="!!timer" :loading="loading" color="error" @click="firstTry">
          <template v-if="timer">
            {{ $t(`${i18nPrefix}.timed_action`, { timer }) }}
          </template>
          <template v-else>
            {{ $t(`${i18nPrefix}.action`) }}
          </template>
        </v-btn>

        <v-btn v-else :disabled="!!timer" :loading="loading" color="error" @click="secondTry">
          <template v-if="timer">
            {{ $t('error.timed_action', { timer }) }}
          </template>
          <template v-else>
            {{ $t('error.action') }}
          </template>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import ezReeportMixin from '~/mixins/ezr';

const DELAY_BEFORE_UNLOCK = 10000;

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    taskId: {
      type: String,
      required: true,
    },
    extendId: {
      type: String,
      required: true,
    },
    lastExtendId: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    defaultId: {
      type: String,
      required: true,
    },
  },
  emits: {
    error: (error: Error) => !!error,
    success: () => true,
  },
  data: () => ({
    shown: false,
    loading: false,
    timer: -1,
    error: undefined as string | undefined,

    willBeLinked: false,
  }),
  computed: {
    i18nPrefix() {
      return `${this.willBeLinked ? '' : 'un'}link`;
    },
  },
  methods: {
    lock() {
      this.timer = DELAY_BEFORE_UNLOCK / 1000;

      const inter = setInterval(() => {
        this.timer -= 1;

        if (this.timer <= 0) {
          this.timer = 0;
          clearInterval(inter);
        }
      }, 1000);
    },
    open(willBeLinked: boolean) {
      this.shown = true;
      this.willBeLinked = willBeLinked;
      this.error = undefined;
      this.loading = false;
      this.lock();
    },
    async link(task: string, template: string) {
      try {
        await this.$ezReeport.sdk.tasks.linkTaskToTemplate(
          task,
          template,
        );

        return true;
      } catch (error) {
        // If an error is already present, then it's the second try
        if (this.error) {
          throw error;
        }

        this.error = (error as Error).message;
        this.lock();
        return false;
      }
    },
    async firstTry() {
      this.loading = true;
      let res = false;
      try {
        if (!this.willBeLinked) {
          await this.$ezReeport.sdk.tasks.unlinkTaskToTemplate(
            this.taskId,
            this.extendId,
          );
          res = true;
        } else {
          if (!this.lastExtendId) {
            throw new Error('No last extended template found');
          }

          res = await this.link(this.taskId, this.lastExtendId);
        }

        if (res) {
          this.$emit('success');
          this.shown = false;
        }
      } catch (error) {
        this.$emit('error', error as Error);
        this.shown = false;
      }
      this.loading = false;
    },
    async secondTry() {
      this.loading = true;
      try {
        await this.link(this.taskId, this.defaultId);

        this.$emit('success');
      } catch (error) {
        this.$emit('error', error as Error);
      }
      this.loading = false;
      this.shown = false;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  unlink:
    title: ''
    description:
      _template: '{intro} {warn} {advice}'
      intro: ''
      warn: ''
      advice: ''
    action: ''
  link:
    title: ''
    description:
      _template: '{intro} {warn} {advice}'
      intro: ''
      warn: ''
      advice: ''
    action: ''
  error:
    title: ''
    description:
      _template: ''
      intro: ''
      question: ''
      advice: ''
    action: ''
    timed_action: '({timer})'
fr:
  unlink:
    title: 'Voulez-vous délier le modèle du rapport ?'
    description:
      _template: '{intro} {warn} {advice}'
      intro: "Délier le rapport l'empêchera de recevoir les mises à jour du modèle et débloquera les visualisations afin de les éditer."
      warn: 'Vous pourrez toujours relier le modèle plus tard, mais il vous faudra alors effectuer manuellement la fusion.'
      advice: "Si vous n'êtes pas sûr de ce que vous faites, reculez."
    action: 'Délier'
    timed_action: 'Délier ({timer})'
  link:
    title: 'Voulez-vous lier le modèle du rapport ?'
    description:
      _template: '{intro} {warn} {advice}'
      intro: "En liant le modèle, ce dernier se mettra à jour, recevra les dernières nouveautés du modèle et bloquera les visualisations."
      warn: 'Cependant, la fusion entres les anciennes visualisations et les nouvelles devra se faire manuellement.'
      advice: "Si vous n'êtes pas sûr de ce que vous faites, reculez."
    action: 'Lier'
    timed_action: 'Lier ({timer})'
  error:
    title: 'Une erreur est survenue...'
    description:
      _template: '{intro} {question} {advice}'
      intro: "Cela peut arriver lorsque le modèle de base n'existe plus..."
      question: 'Voulez-vous lier le rapport au modèle par défaut ?'
      advice: "Si vous n'êtes pas sûr de ce que vous faites, reculez."
    action: 'Lier au modèle par défaut'
    timed_action: 'Lier au modèle par défaut ({timer})'
</i18n>
