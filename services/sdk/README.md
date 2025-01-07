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

```js
import { prepareClient } from '@ezpaarse-project/ezreeport-sdk-js';
import { getCurrentUser } from '@ezpaarse-project/ezreeport-sdk-js/auth';

prepareClient(
  'https://url-to-ezreeport.api/', // Set URL to ezREEPORT API
  { token: 'mySuperSecretToken' }, // Set token of current user
);

// You can now use sdk

// Log current user
getCurrentUser()
  .then((user) => { console.log(user); }),
```

## Documentation

The documentation is available at <https://ezpaarse-project.github.io/ezreeport/sdk-js>

You can also run `pnpm run preview` to run it on a local server.
