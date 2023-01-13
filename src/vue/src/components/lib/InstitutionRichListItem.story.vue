<template>
  <Story title="internal/InstitutionRichListItem">
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <InstitutionRichListItem :institution="data" />
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
          <InstitutionRichListItem :institution="data" />
        </v-theme-provider>
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Error"
      icon="material-symbols:error-outline"
    >
      <v-app style="background: transparent">
        <InstitutionRichListItem :institution="data" />
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Loading"
      icon="material-symbols:refresh"
    >
      <v-app style="background: transparent">
        <InstitutionRichListItem :institution="data" />
        <HstLocale />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { InstitutionItem } from './InstitutionRichListItem.vue';

const data = ref<InstitutionItem>({
  id: 'bib-cnrs-inist',
  name: 'Inist-CNRS Bibcnrs',
  city: 'Vandœuvre-lès-Nancy',
  logoId: 'd80d56af8ee12a08a4be022dd544dc2b.png',
  acronym: 'CNRS',
});
</script>

<docs lang="md">
# Institution Rich List Item

Wrapper of a RichListItem for institutions
</docs>
