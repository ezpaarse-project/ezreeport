#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOCAL_ENV_FILE="$SCRIPT_DIR/reporting.local.env.sh"

export REDIS_HOST=""
export REDIS_PORT=""
export REDIS_PASSWORD=""
export REDIS_CONCURRENCE=""

export ELASTIC_SCHEME=""
export ELASTIC_HOST=""
export ELASTIC_PORT=""
# API key must have "monitor" and "manage_security" privileges
export ELASTIC_API_KEY=""

export DATABASE_PROTOCOL="postgresql"
export DATABASE_USER="postgres"
export DATABASE_PASSWORD="changeme"
export DATABASE_HOST="db"
export DATABASE_PORT=5432
export DATABASE_DB="postgres"
export DATABASE_URL="$DATABASE_PROTOCOL://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_DB?schema=default"

export SMTP_HOST="maildev"
export SMTP_PORT=1025
export SMTP_SECURE=""
export SMTP_IGNORE_TLS=""
export SMTP_REJECT_UNAUTHORIZED=""

export EMAIL_SENDER=""
export EMAIL_EZTEAM=""
export EMAIL_ATTEMPTS=""
export EMAIL_ATTEMPTS_INTERVAL=""

export EZMESURE_AUTH_SECRET=""

# Comma separated origins (or * to allow all)
export ALLOWED_ORIGINS="*"
export LOG_LEVEL=""
export CRON_DAILY=""

if [[ -f $LOCAL_ENV_FILE ]] ; then
  source "$LOCAL_ENV_FILE"
fi
