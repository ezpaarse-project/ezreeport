# region Common

# Base image for node, enable usage of pnpm and allow to run apps
FROM node:20.11.1-alpine3.19 AS base
LABEL maintainer="ezTeam <ezteam@couperin.org>"
LABEL org.opencontainers.image.source="https://github.com/ezpaarse-project/ezreeport"

ENV HUSKY=0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Update APK registry
RUN apk update \
  && apk upgrade -U -a

RUN corepack enable \
  && corepack prepare pnpm@10.7.1 --activate

# endregion
# ---
# region Turbo

# Base image for turbo, allow to properly install split each service
FROM base AS turbo
WORKDIR /usr/src

COPY ./package.json ./

RUN pnpm run turbo:install

COPY . .

# endregion
# ---
# region Database

# Extract database from repo
FROM turbo AS database-turbo

RUN turbo prune @ezreeport/database --docker --out-dir ./database
# ---
# Prepare prod dependencies for DATABASE
FROM turbo AS database-pnpm
WORKDIR /usr/build/database

COPY --from=database-turbo /usr/src/database/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=database-turbo /usr/src/database/full .

RUN pnpm deploy --legacy --filter @ezreeport/database ./dev
# ---
# Generate prisma client using dev dependencies
FROM turbo AS database-prisma
WORKDIR /usr/build/database/dev

# Install prisma dependencies
RUN apk add --no-cache --update python3 \
	&& ln -sf python3 /usr/bin/python

COPY --from=database-pnpm /usr/build/database/dev .

# Generate prisma-client
RUN pnpm run db:generate
# ---
# Final image to run migrations
FROM database-prisma AS migrate

CMD [ "npm", "run", "db:deploy" ]

# endregion
# ---
# region API

# Extract api from repo
FROM turbo AS api-turbo

RUN turbo prune ezreeport-report --docker --out-dir ./api
# ---
# Prepare prod dependencies for API
FROM turbo AS api-pnpm
WORKDIR /usr/build/api

COPY --from=api-turbo /usr/src/api/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=api-turbo /usr/src/api/full .

RUN pnpm deploy --legacy --filter ezreeport-report --prod ./prod
COPY --from=database-prisma /usr/build/database/dev/.prisma ./prod/node_modules/@ezreeport/database/.prisma

# ---
# Final image to run API service
FROM base AS api
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/api

COPY --from=api-pnpm /usr/build/api/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Worker

# Extract worker from repo
FROM turbo AS worker-turbo

RUN turbo prune ezreeport-worker --docker --out-dir ./worker
# ---
# Prepare prod dependencies for worker
FROM turbo AS worker-pnpm
WORKDIR /usr/build/worker

# Install node-canvas build dependencies
# see https://github.com/Automattic/node-canvas/issues/866
RUN apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev pixman-dev

COPY --from=worker-turbo /usr/src/worker/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=worker-turbo /usr/src/worker/full .

RUN pnpm deploy --legacy --filter ezreeport-worker --prod ./prod

# ---
# Final image to run worker service
FROM base AS worker
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/worker

# Install node-canvas dependencies
RUN apk add --no-cache cairo jpeg pango pixman

COPY --from=worker-pnpm /usr/build/worker/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Scheduler

# Extract scheduler from repo
FROM turbo AS scheduler-turbo

RUN turbo prune ezreeport-scheduler --docker --out-dir ./scheduler
# ---
# Prepare prod dependencies for scheduler
FROM turbo AS scheduler-pnpm
WORKDIR /usr/build/scheduler

COPY --from=scheduler-turbo /usr/src/scheduler/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=scheduler-turbo /usr/src/scheduler/full .

RUN pnpm deploy --legacy --filter ezreeport-scheduler --prod ./prod
COPY --from=database-prisma /usr/build/database/dev/.prisma ./prod/node_modules/@ezreeport/database/.prisma

# ---
# Final image to run scheduler service
FROM base AS scheduler
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/scheduler

COPY --from=scheduler-pnpm /usr/build/scheduler/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Mail

# Extract mail from repo
FROM turbo AS mail-turbo

RUN turbo prune ezreeport-mail --docker --out-dir ./mail
# ---
# Prepare prod dependencies for mail
FROM turbo AS mail-pnpm
WORKDIR /usr/build/mail

COPY --from=mail-turbo /usr/src/mail/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=mail-turbo /usr/src/mail/full .

RUN pnpm deploy --legacy --filter ezreeport-mail --prod ./prod

# ---
# Final image to run mail service
FROM base AS mail
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/mail

COPY --from=mail-pnpm /usr/build/mail/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Files

# Extract files from repo
FROM turbo AS files-turbo

RUN turbo prune ezreeport-files --docker --out-dir ./files
# ---
# Prepare prod dependencies for files
FROM turbo AS files-pnpm
WORKDIR /usr/build/files

COPY --from=files-turbo /usr/src/files/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=files-turbo /usr/src/files/full .

RUN pnpm deploy --legacy --filter ezreeport-files --prod ./prod

# ---
# Final image to run files service
FROM base AS files
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/files

COPY --from=files-pnpm /usr/build/files/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region All In One

# Prepare SDK to be used in other images
FROM base AS aio
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build

COPY ./services/ecosystem.config.js .
RUN npm install -g pm2@^6.0.5 tsx@^4.19.1

RUN apk add --no-cache cairo jpeg pango pixman

COPY --from=api /usr/build/api ./report
COPY --from=worker /usr/build/worker ./worker
COPY --from=scheduler /usr/build/scheduler ./scheduler
COPY --from=mail /usr/build/mail ./mail
COPY --from=files /usr/build/files ./files

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD ["pm2-runtime", "ecosystem.config.js"]

# endregion
# ---
# region SDK

# Extract sdk from repo
FROM turbo AS sdk-turbo

RUN turbo prune @ezpaarse-project/ezreeport-sdk-js --docker
# ---
# Prepare SDK to be used in other images
FROM turbo AS sdk-pnpm
WORKDIR /usr/build/sdk

COPY --from=sdk-turbo /usr/src/out/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=sdk-turbo /usr/src/out/full .

RUN turbo run @ezpaarse-project/ezreeport-sdk-js#build

# endregion
# ---
# region Vue

# Extract vue from repo
FROM turbo AS vue-turbo

RUN turbo prune @ezpaarse-project/ezreeport-vue --docker
# ---
# Prepare Vue to be used in other images
FROM turbo AS vue-pnpm
WORKDIR /usr/build/vue

COPY --from=vue-turbo /usr/src/out/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=vue-turbo /usr/src/out/full .

RUN turbo run @ezpaarse-project/ezreeport-vue#build

# endregion
# ---
# region Vue Documentation

# Build vue documentation
FROM vue-pnpm AS vuedoc-builder
WORKDIR /usr/build/vue

ARG REPORT_TOKEN="changeme" \
   REPORT_API="http://localhost:8080/"

ENV VITE_EZR_TOKEN=${REPORT_TOKEN} \
    VITE_EZR_API=${REPORT_API}

RUN turbo run build:docs

# ---
# Final image to run vue documentation on nginx
FROM nginx:stable-alpine AS vuedoc
WORKDIR /usr/share/nginx/html

COPY ./config/vue-ngnix.types /etc/nginx/mime.types
COPY --from=vuedoc-builder /usr/build/vue/storybook-static ./

EXPOSE 80

# endregion
