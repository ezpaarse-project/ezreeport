#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOCAL_ENV_FILE="$SCRIPT_DIR/ezreeport.local.env.sh"

## ==== PROD ====

# node
export NODE_ENV="production"

# redis service
export REDIS_HOST="redis"
export REDIS_PORT=6379
export REDIS_PASSWORD="changeme"

# elastic
export ELASTIC_SCHEME="https"
export ELASTIC_HOST="host.docker.internal"
export ELASTIC_PORT=9200
export ELASTIC_USERNAME="elastic"
export ELASTIC_PASSWORD="changeme"
export ELASTIC_API_KEY="" # Base 64
export ELASTIC_URL="$ELASTIC_SCHEME://$ELASTIC_HOST:$ELASTIC_PORT"
export ELASTIC_REQUIRED_STATUS="green"
export ELASTIC_MAX_TRIES="10"

# db service
export DATABASE_PROTOCOL="postgresql"
export DATABASE_USER="postgres"
export DATABASE_PASSWORD="changeme"
export DATABASE_HOST="db"
export DATABASE_PORT=5432
export DATABASE_DB="postgres"
export DATABASE_URL="$DATABASE_PROTOCOL://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_DB?schema=default"

# smtp
export SMTP_HOST="maildev"
export SMTP_PORT=1025
export SMTP_SECURE="false"
export SMTP_IGNORE_TLS="true"
export SMTP_REJECT_UNAUTHORIZED="false"

# mail service
export EMAIL_SENDER="ezreeport@inist.fr"
export EMAIL_SUPPORT_TEAM="ezteam@couperin.org"
export EMAIL_DEV_TEAM="ezteam-dev@couperin.org"
export EMAIL_ATTEMPTS=5
export EMAIL_ATTEMPTS_INTERVAL=2000
export EMAIL_MEM_LIMIT=3 # in Go. Should be at least `0.3 + (WORKERS_CONCURRENCE * 0.3)`

# workers
export WORKERS_CONCURRENCE=5
export WORKERS_MAX_EXEC_TIME=10000

# report service
export REPORT_ADMIN_KEY=""
export REPORT_CRON_TZ="" # Timezone wanted for the cron execution
export REPORT_CRON_TIMER_GENERATE_REPORT="0 12 * * *"
export REPORT_CRON_TIMER_PURGE_OLD_REPORT="0 12 * * *"
export REPORT_ITERATIONS_TO_LIVE=2
export REPORT_DAYS_TO_LIVE=7
export REPORT_MEM_LIMIT=7 # in Go. Should be at least `0.5 + (2 * WORKERS_CONCURRENCE * 0.5) + (count of crons * 0.5)`
export REPORT_PACKAGE_NAME="ezreeport-report"

# common to all services
export API_URL="http://localhost:8080"
export API_ALLOWED_ORIGINS="*" # Comma separated origins (or * to allow all)
export LOG_LEVEL="info"
export HTTP_PORT=8080

## ==== DEV ====

export BUILD_GITHUB_TOKEN="" # GitHub token to publish release
export BUILD_DOCKER_REGISTRY="docker.io" # Docker registry

## ==== LOCAL ====

if [[ -f $LOCAL_ENV_FILE ]] ; then
  source "$LOCAL_ENV_FILE"
fi
