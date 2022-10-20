#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOCAL_ENV_FILE="$SCRIPT_DIR/reporting.local.env.sh"

export REDIS_HOST=""
export REDIS_PORT=""
export REDIS_PASSWORD=""

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

export EZMESURE_AUTH_SECRET=""

export LOG_LEVEL=""

if [[ -f $LOCAL_ENV_FILE ]] ; then
  source "$LOCAL_ENV_FILE"
fi

