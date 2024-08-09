# ezReeport

Reporting service for ezMESURE/ezCOUNTER

## Prerequisites
* [docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)
* [pnpm](https://pnpm.io/)

## Installation

```bash
git clone https://github.com/ezpaarse-project/ezreeport.git
echo 'ELASTIC_URL="${ELASTIC_SCHEME:-https}://${ELASTIC_HOST}:${ELASTIC_PORT:-9200}"\n\nDATABASE_URL="${DATABASE_PROTOCOL:-postgresql}://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=default"' > .env.local
pnpm i
```

## Start ezREEPORT

### Production mode

```bash
source ezreeport.env.sh
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.migrate.yml up -d
docker compose -f docker-compose.yml up -d
```

### Development mode

```bash
source ezreeport.env.sh
docker compose -f docker-compose.yml -f docker-compose.debug.yml pull
docker compose -f docker-compose.migrate.yml up -d
docker compose -f docker-compose.yml -f docker-compose.debug.yml up -d
```

### Run tests

> [!CAUTION]
> Tests aren't complete and may be broken


Located at `tests/`

```sh
npm test
```

## Contributions

### Main workflow

Workflow used here is the same as Git Flow :

- To make new changes : create a `feature/*` branch
- Once feature is completed, make a [Pull Request](https://github.com/ezpaarse-project/ezreeport/compare) from your branch to the `dev` branch
- Once a new version is ready, create a new `rc/*` branch and make a (draft) PR to the `master` branch
- Once the new version is deployed, merge the PR

## Components

### Services

- `services/report`: (ezreeport-report)
  - Generate PDF reports with HTTP API. Also run cronjob to generate reports
- `services/mail`: (ezreeport-mail)
  - Handle email management


### Packages

- `services/cli/ezra` (@ezpaarse-project/ezreeport-admin)
  - CLI client for managing ezREEPORT instances
- `services/sdk` (@ezpaarse-project/sdk-js)
  - SDK for ezReeport API
- `services/vue` (ezreeport-vue)
  - Vue components that use SDK for displaying info
  - It also contains an example with [Nuxt](https://nuxtjs.org/) at `src/vue/example` (it's not part of the workspace because of webpack issues)

### Inter dependencies between components

Some components are depending on each others, so you may need to build/push some components before others.

Here's a quick view to see thoses relations :

```
├─ ezreeport-mail
├─ ezreeport-report
├─ @ezpaarse-project/ezreeport-admin
└─ @ezpaarse-project/sdk-js
   └─ @ezpaarse-project/vue
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

## Publishing components

```bash
# Test, and build a first time to test if everything is stable

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