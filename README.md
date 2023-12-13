# ezReeport

Reporting service for ezMESURE/ezCOUNTER

## Prerequisites
* [docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)

## Installation

```bash
git clone https://github.com/ezpaarse-project/ezreeport.git
npm run setup
```

## Main branches

- `master`:
  - Should be the version used on prod (vp)
- `rc`:
  - Should be the version used on integ (vi)
  - Versions are suffixed by `-rc`
- `dev`:
  - Should be the version used on dev (vd)
  - Versions are suffixed by `-beta`

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
docker compose -f docker-compose.migrate.yml up -d
docker compose -f docker-compose.yml up -d
```

### Dev

```bash
source ezreeport.env.sh
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
# Generate changelogs, etc. as it will bump version
npm run publish
# Build and push to registries
```