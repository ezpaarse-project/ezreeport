# Reporting

Reporting service for ezMESURE/ezCOUNTER

## Prerequisites
* [docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)

## Installation

```bash
git clone https://github.com/ezpaarse-project/reporting.git
npm run setup
```

## Services

- src/report:
  - Generate PDF reports with HTTP API. Also run cronjob to regullary generate reports
- src/redis:
  - Handle email queues
- src/mail:
  - Handle email management
- src/db:
  - Keeps templates (even custom ones) & scheduled tasks

## Start

```sh
source reporting.env.sh
npm run start
```