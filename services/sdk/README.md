# @ezpaarse-project/ezreeport-sdk-js

> SDK used to interact with ezREEPORT API

## Features

- ✅ User requests
- ✅ Follow generation of report
- ✅ Automatic parsing (dates, enums, etc.)
- ❌ Admin requests (the ones that need API key)

## Install

```sh
npm i --save @ezpaarse-project/ezreeport-sdk-js
```

## First Usage

You will need to wrap your app with the `<ezr-provider>` and give some parameters :

```js
import * as sdk from '@ezpaarse-project/ezreeport-sdk-js';

// Set URL to ezREEPORT API
sdk.setup.setURL('https://url-to-ezreeport.api/');
// Set token of current user
sdk.auth.login('mySuperSecretToken');

// You can now use sdk

// Log current user
sdk.auth.getCurrentUser()
  .then(({ content }) => { console.log(content); }),
```

## Documentation

The documentation is available at <https://ezpaarse-project.github.io/ezreeport/sdk-js>

You can also run `npm run build:docs && npm run docs` to run it on a local server.
