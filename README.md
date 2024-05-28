# ezReeport

Reporting service for ezMESURE/ezCOUNTER

## Prerequisites
* [docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)
* [pnpm](https://pnpm.io/)

## Installation

```bash
git clone https://github.com/ezpaarse-project/ezreeport.git
echo '#!/bin/bash\n\nexport ELASTIC_URL="$ELASTIC_SCHEME://$ELASTIC_HOST:$ELASTIC_PORT"\n\nexport DATABASE_URL="$DATABASE_PROTOCOL://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_DB?schema=default"' > ezreeport.local.env.sh
pnpm i
```

## Main branches

- `master`:
  - Should be the version used on prod (vp)
- `rc/*`:
  - Should be the version used on integ (vi)
  - Versions are suffixed by `-rc.*`
- `dev`:
  - Should be the version used on dev (vd)
  - Versions are suffixed by `-beta.*`

### Workflow

Workflow used here is the same as Git Flow :

- To make new changes : create a `feature/*` branch
- Once feature is completed, make a [Pull Request](https://github.com/ezpaarse-project/ezreeport/compare) from your branch to the `dev` branch
- Once a new version is ready, create a new `rc/*` branch and make a (draft) PR to the `master` branch
- Once the new version is deployed, merge the PR

## Services

- `src/services/report`: (ezreeport-report)
  - Generate PDF reports with HTTP API. Also run cronjob to generate reports
- `src/services/mail`: (ezreeport-mail)
  - Handle email management


## Packages

- `src/sdk` (ezreeport-sdk-js)
  - SDK for ezReeport API
- `src/vue` (ezreeport-vue)
  - Vue components that use SDK for displaying info
  - It also contains an example with [Nuxt](https://nuxtjs.org/) at `src/vue/example` (it's not part of the workspace because of webpack issues)

## Start

### Prod

```bash
source ezreeport.env.sh
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.migrate.yml up -d
docker compose -f docker-compose.yml up -d
```

### Dev

```bash
source ezreeport.env.sh
docker compose -f docker-compose.yml -f docker-compose.debug.yml pull
docker compose -f docker-compose.migrate.yml up -d
docker compose -f docker-compose.yml -f docker-compose.debug.yml up -d
```

## Test

Located at `tests`

```bash
npm test
```

## Publish

```bash
# Test, and build a first time to test

# Generate changelogs, etc. as it will bump version (called tag later)
pnpm run publish

# Build and push report + mail on github registry
docker build --target $SERVICE -t ezreeport/$SERVICE:$TAG .
docker tag ezreeport/$SERVICE:$TAG ghcr.io/ezpaarse-project/ezreeport-$SERVICE:$TAG
docket push ghcr.io/ezpaarse-project/ezreeport-$SERVICE:$TAG

# Build and push sdk -> vue on npm
pnpm --filter $PACKAGE run build
pnpm --filter $PACKAGE publish --access public
```