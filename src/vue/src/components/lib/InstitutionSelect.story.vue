<template>
  <Story title="internal/InstitutionSelect">
    <template #controls>
      <HstSelect
        v-model="current"
        :options="ids"
        title="Current"
      />
    </template>

    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <InstitutionSelect
            v-model="current"
            :mock="{ data }"
            @input="logEvent('input', $event)"
          />
        </v-theme-provider>
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <InstitutionSelect
            v-model="current"
            :mock="{ data }"
            @input="logEvent('input', $event)"
          />
        </v-theme-provider>
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Error"
      icon="material-symbols:error-outline"
    >
      <v-app style="background: transparent">
        <InstitutionSelect
          v-model="current"
          :mock="{ data, error: 'Mock error' }"
          @input="logEvent('input', $event)"
        />
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Loading"
      icon="material-symbols:refresh"
    >
      <v-app style="background: transparent">
        <InstitutionSelect
          v-model="current"
          :mock="{ data, loading: true }"
          @input="logEvent('input', $event)"
        />
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Live data"
      icon="material-symbols:cloud-outline"
    >
      <v-app style="background: transparent">
        <InstitutionSelect
          v-model="current"
          @input="logEvent('input', $event)"
        />
        <HstLocale />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { isCollecting, logEvent } from 'histoire/client';
import { useEzReeport } from '../..';
import { InstitutionItem } from './InstitutionSelect.vue';

const $ezReeport = useEzReeport();

const current = ref('');
const data = ref<InstitutionItem[]>([
  {
    id: 'bib-cnrs-inist',
    name: 'Inist-CNRS Bibcnrs',
    city: 'Vandœuvre-lès-Nancy',
    logoId: 'd80d56af8ee12a08a4be022dd544dc2b.png',
    acronym: 'CNRS',
  },
  {
    id: 'iep-lion',
    name: "Institut d'études politiques de Lyon",
    city: 'lyon',
    logoId: 'f52c95fe348d72396c110be994f2a252.png',
    acronym: 'IEP Lyon',
  },
  {
    id: 'st-genev',
    name: 'Bibliothèque inter-universitaire Sainte-Geneviève',
    city: 'Paris',
    logoId: '4b7bde4854885dea2662f632f04d32b2.png',
  },
]);
const ids = computed(() => [
  { value: '', label: 'All institutions' },
  ...data.value.map(({ id, name }) => ({ value: id, label: name })),
]);

onMounted(() => {
  if (!isCollecting()) {
    // do something only in the browser
    $ezReeport.auth_token = import.meta.env.VITE_EZMESURE_TOKEN;
  }
});
</script>

<docs lang="md">
# Institution Select

...
</docs>
