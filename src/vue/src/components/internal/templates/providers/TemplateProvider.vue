<template>
  <div>
    <slot />

    <v-snackbar
      :value="templateStore.error.i18n || templateStore.error.message"
      :timeout="5000"
      color="red accent-2"
      @input="templateStore.error = {}"
    >
      <template v-if="templateStore.error.i18n">
        {{ $t(templateStore.error.i18n) }}
      </template>
      <template v-else-if="templateStore.error.message">
        {{ templateStore.error.message }}
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ezReeportMixin from '~/mixins/ezr';
import useTemplateStore from '~/stores/template';

export default defineComponent({
  mixins: [ezReeportMixin],
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  watch: {
    // eslint-disable-next-line func-names
    '$ezReeport.data.auth.permissions': async function () {
      this.templateStore.refreshAvailableTemplates();
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  errors:
    unknown: 'Unknown error'
fr:
  errors:
    unknown: 'Erreur inconnue'
</i18n>
