# @ezpaarse-project/ezreeport-vue

> Vue components used to interact with ezREEPORT API

## Requirements

- `vue@^3.5` ([npm](https://www.npmjs.com/package/vue))
- `vue-i18n@^10` ([npm](https://github.com/kazupon/vue-i18n))
- `vuetify@^3.7` ([npm](https://github.com/vuetifyjs/vuetify/tree/v2-stable))
- `@mdi/font@^7.4` ([npm](https://github.com/Templarian/MaterialDesign-Webfont))

## Install

```sh
npm i --save @ezpaarse-project/ezreeport-vue
```

## First Usage

In order to use ezreeport components, you need to register the plugin in your Vue application :

```js
import { createApp } from 'vue';

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { en as vuetifyEn, fr as vuetifyFr } from 'vuetify/locale';
import { createVuetify } from 'vuetify'

import { createI18n } from 'vue-i18n';

import '@ezpaarse-project/ezreeport-vue/styles';
import { en as ezrEn, fr as ezrFr } from '@ezpaarse-project/ezreeport-vue/locale';
import ezreeportVue from '@ezpaarse-project/ezreeport-vue';

const app = createApp({ /* ... */ });

const i18n = createI18n({
  // You can manually merge messages
  // You may want to include vuetify messages
  messages: {
    en: { $vuetify: vuetifyEn, $ezreeport: ezrEn },
    fr: { $vuetify: vuetifyFr, $ezreeport: ezrFr },
  },
})
app.use(i18n);

const vuetify = createVuetify({ /* ... */ });
app.use(vuetify); // You need to setup Vuetify before ezreeport

app.use(ezreeportVue, {
  locale: {
    i18n: i18n.global, // You can pass the instance of i18n and plugin will merge messages
    namespaces: {
      // You can custom how "namespaces" are displayed, you can use a string
      // that will passed to all locales of i18n
      label: '@:institutions.title',
      // Or pass individual definitions
      label: {
        en: 'Institution',
        fr: 'Établissement'
      }
    },
  },
})
```

Whenever you'll use a ezreeport component, you will need to setup ezreeport's SDK with the `prepareClient` function :

```html
<template>
  <ezr-health-status />
</template>

<script setup>
// ezreeport setup
import { prepareClient } from '@ezpaarse-project/ezreeport-vue';

prepareClient(
  'http://localhost:8080', // ezREEPORT API url
  { token: '<CURRENT USER TOKEN>' }
);
</script>
```

### Nuxt 3

You can use nuxt modules like `vuetify-nuxt-module` ([npm](https://www.npmjs.com/package/vuetify-nuxt-module)) and `@nuxtjs/i18n` ([npm](https://www.npmjs.com/package/@nuxtjs/i18n)) instead of raw dependencies.

Add plugin config into `plugins/ezreeport.ts` :

```ts
// plugins/ezreeport.js|ts
import { defineNuxtPlugin } from '#imports';
import ezreeportVue from '@ezpaarse-project/ezreeport-vue';

export default defineNuxtPlugin({
  async setup(nuxtApp) {
    // We need to wait for vuetify
    nuxtApp.hook('vuetify:ready', () => {
      nuxtApp.vueApp.use(ezreeportVue, {
        locale: {
          i18n: nuxtApp.$i18n, // Pass current instance of i18n
        },
      });
    });
  },
});
```

## Documentation / Dev

Since many components directly use ezREEPORT's API, you must run a working [ezREEPORT](../../README.md) in order to start/generate documentation.

### Manually (or dev)

Create a `.env.local` and overrides env vars :

- `VITE_EZR_TOKEN`: Used to login
- `VITE_EZR_API`: Used to fetch data, etc.

Then run

```sh
npm run build:story
# or npm run dev
```

Finally run an http server over newly created `storybook-static`.

### Docker

A the root of this monorepo, there's a [`Dockerfile`](../../Dockerfile) wtih a `vuedoc` target that you can use to generate a static version of the documentation.

The dockerfile accept 3 arguments :

- REPORT_TOKEN: Used to login
- REPORT_API: Used to fetch data, etc.

Example :

```sh
docker build \
  --target vuedoc \
  -t ezreeport-vuedoc:latest \
  --build-arg REPORT_TOKEN="MySecretTokenGeneratedByEzReeport" \
  --build-arg REPORT_API="https://url-to-ezreeport.dev/api/" \
  .
```

Once built, you can start the documentation by running (`8888` is just the port on the host machine, you can change it to whatever you want) :

```sh
docker run -p 8888:80 ezreeport-vuedoc:latest
```