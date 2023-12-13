# @ezpaarse-project/ezreeport-vue

> Vue components used to interact with ezREEPORT API

## Requirements

- `vue@^2.7` ([npm](https://www.npmjs.com/package/vue))
- `vue-i18n@^8.28` ([npm](https://github.com/kazupon/vue-i18n))
- `vuetify@^2.6` ([npm](https://github.com/vuetifyjs/vuetify/tree/v2-stable))
- `@mdi/font@^7` ([npm](https://github.com/Templarian/MaterialDesign-Webfont))

## Install

```sh
npm i --save @ezpaarse-project/ezreeport-vue
```

### Webpack

You may need to add this in your `webpack.config.js|ts` (see [vuetify issue](https://github.com/vuetifyjs/vuetify/discussions/4068#discussioncomment-24984) for more info) :

```js
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      'vue$': path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm.js'),
      '^vuetify': path.resolve(__dirname, 'node_modules/vuetify'),
    }
  }
}
```

### Vite (untested)

Similar to webpack, you may need to add this in your `vite.config.js|ts` (see [vuetify issue](https://github.com/vuetifyjs/vuetify/discussions/4068#discussioncomment-24984) for more info) :

```ts
export default defineConfig({
  resolve: {
    alias: {
      vue: 'vue/dist/vue.runtime.esm.js',
    },
  },
});
```

### Nuxt2

You can use nuxt modules like `@nuxtjs/vuetify@^1.12.3` ([npm](https://www.npmjs.com/package/@nuxtjs/vuetify)) and `@nuxtjs/i18n@^7.3.1` ([npm](https://www.npmjs.com/package/@nuxtjs/i18n)) instead of raw dependencies.

Add plugin and webpack config into `nuxt.config.js|ts` :

```ts
// nuxt.config.js|ts
export default {
  plugins: [
    '~/plugins/ezreeport-vue2.ts', // TODO: change path to your plugin file
  ],

  buildModules: [
    '@nuxtjs/vuetify',
  ],

  modules: [
    '@nuxtjs/i18n',
  ],

  extend(config, ctx) {
    // Since Nuxt2 is using webpack, we need to "patch" module resolution
    // https://github.com/vuetifyjs/vuetify/discussions/4068#discussioncomment-24984
    config.resolve.alias.vue$ = path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm.js');
    config.resolve.alias['^vuetify'] = path.resolve(__dirname, 'node_modules/vuetify');
  },
}
```

## First Usage

You will need to wrap your app with the `<ezr-provider>` and give some parameters :

```html
<template>
  <ezr-provider
    api-url="https://url-to-ezreeport.api/"
  >
    <ezr-status-list />
  </ezr-provider>
</template>
```

## Documentation / Dev

Since many components directly use ezREEPORT's API, you must run a working [ezREEPORT](../../README.md) in order to start/generate documentation.

### Manually (or dev)

Create a `.env.local` and overrides env vars :

- VITE_AUTH_TOKEN: Used to login
- VITE_REPORT_API: Used to fetch data, etc.
- VITE_NAMESPACES_LOGO_URL: Used to show namespaces logos

Then run

```sh
npm run build:doc
# or npm run dev
```

Finally run an http server over newly created `storybook-static`.

### Docker

A the root of this monorepo, there's a [`Dockerfile.vuedoc`](../../Dockerfile.vuedoc) that you can use to generate a static version of the documentation.

The dockerfile accept 3 arguments :

- AUTH_TOKEN: Used to login
- REPORT_API: Used to fetch data, etc.
- LOGO_URL: Used to show namespaces logos

Example :

```sh
docker build \
  -f "Dockerfile.vuedoc" \
  -t ezreeport-vuedoc:latest \
  --build-arg AUTH_TOKEN="MySecretTokenGeneratedByEzReeport" \
  --build-arg REPORT_API="https://url-to-ezreeport.dev/api/" \
  --build-arg LOGO_URL="https://url-to-your-apps.dev/namespaces/logos" \
  .
```


Once built, you can start the documentation by running (`8888` is just the port on the host machine, you can change it to whatever you want) :

```sh
docker run -p 8888:80 ezreeport-vuedoc:latest
```