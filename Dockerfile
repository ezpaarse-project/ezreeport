# region Common

# Base image for node, enable usage of pnpm and allow to run apps
FROM node:24.20.0-alpine3.24 AS base
LABEL maintainer="ezTeam <ezteam@couperin.org>"
LABEL org.opencontainers.image.source="https://github.com/ezpaarse-project/ezreeport"

ENV PNPM_HOME="/pnpm" \
    TURBO_CACHE_DIR="/turbo" \
    PATH="$PNPM_HOME:$PATH"

# Update APK registry
RUN apk update \
  && apk upgrade -U -a

# endregion
# ---
# region Turbo

# Base image for turbo, allow to properly install split each service
FROM base AS pnpm
WORKDIR /usr/src

# Install node-canvas build dependencies
# see https://github.com/Automattic/node-canvas/issues/866
RUN apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev pixman-dev librsvg-dev

COPY . .

RUN corepack enable && corepack install

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm ci

# endregion
# ---
# region Database

# Prepare dependencies for database client
FROM pnpm AS database-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter @ezreeport/database --prod /usr/build/database
# ---
# Final image to run migrations
FROM base AS migrate
ENV NODE_ENV=production
WORKDIR /usr/build/database

COPY --from=database-pnpm /usr/build/database .

CMD [ "npx", "prisma", "migrate", "deploy" ]

# endregion
# ---
# region API

# Prepare prod dependencies for API
FROM pnpm AS api-builder
WORKDIR /usr/src

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezreeport-report#build

RUN pnpm deploy --filter ezreeport-report --prod /usr/build/api && \
  cp -r /usr/build/api/node_modules /usr/build/api/package.json /usr/build/api/dist

# ---
# Final image to run API service
FROM base AS api
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/api

COPY --from=api-builder /usr/build/api/dist .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "node", "--enable-source-maps", "app.cjs" ]

# endregion
# ---
# region Worker

# Prepare prod dependencies for worker
FROM pnpm AS worker-builder
WORKDIR /usr/src

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezreeport-worker#build

RUN pnpm deploy --filter ezreeport-worker --prod /usr/build/worker && \
  cp -r /usr/build/worker/node_modules /usr/build/worker/package.json /usr/build/worker/dist

# ---
# Final image to run worker service
FROM base AS worker
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/worker

# Install node-canvas dependencies
RUN apk add --no-cache cairo jpeg pango pixman librsvg

COPY --from=worker-builder /usr/build/worker/dist .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "node", "--enable-source-maps", "app.cjs" ]

# endregion
# ---
# region Scheduler

# Prepare prod dependencies for scheduler
FROM pnpm AS scheduler-builder
WORKDIR /usr/src

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezreeport-scheduler#build

RUN pnpm deploy --filter ezreeport-scheduler --prod /usr/build/scheduler && \
  cp -r /usr/build/scheduler/node_modules /usr/build/scheduler/package.json /usr/build/scheduler/dist

# ---
# Final image to run scheduler service
FROM base AS scheduler
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/scheduler

COPY --from=scheduler-builder /usr/build/scheduler/dist .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "node", "--enable-source-maps", "app.cjs" ]

# endregion
# ---
# region Mail

# Prepare prod dependencies for mail
FROM pnpm AS mail-builder
WORKDIR /usr/src

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezreeport-mail#build

RUN pnpm deploy --filter ezreeport-mail --prod /usr/build/mail && \
  cp -r /usr/build/mail/node_modules /usr/build/mail/package.json /usr/build/mail/dist

# ---
# Final image to run mail service
FROM base AS mail
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/mail

COPY --from=mail-builder /usr/build/mail/dist .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "node", "--enable-source-maps", "app.cjs" ]

# endregion
# ---
# region Files

# Prepare prod dependencies for files
FROM pnpm AS files-builder
WORKDIR /usr/src

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezreeport-files#build

RUN pnpm deploy --filter ezreeport-files --prod /usr/build/files && \
  cp -r /usr/build/files/node_modules /usr/build/files/package.json /usr/build/files/dist

# ---
# Final image to run files service
FROM base AS files
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/files

COPY --from=files-builder /usr/build/files/dist .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "node", "--enable-source-maps", "app.cjs" ]

# endregion
# ---
# region All In One

# Final image to run all services
FROM base AS aio
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build

RUN apk add --no-cache cairo jpeg pango pixman librsvg

RUN npm install -g pm2@^7.0.3

COPY --from=api-builder /usr/build/api/dist ./api
COPY --from=worker-builder /usr/build/worker/dist ./worker
COPY --from=scheduler-builder /usr/build/scheduler/dist ./scheduler
COPY --from=mail-builder /usr/build/mail/dist ./mail
COPY --from=files-builder /usr/build/files/dist ./files

COPY ./services/ecosystem.config.js .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD ["pm2-runtime", "ecosystem.config.js"]

# endregion
