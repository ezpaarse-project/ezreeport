# region Common

# Base image for node, enable usage of pnpm and allow to run apps
FROM node:24.4.1-alpine3.22 AS base
LABEL maintainer="ezTeam <ezteam@couperin.org>"
LABEL org.opencontainers.image.source="https://github.com/ezpaarse-project/ezreeport"

ENV HUSKY=0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Update APK registry
RUN apk update \
  && apk upgrade -U -a

# endregion
# ---
# region Turbo

# Base image for turbo, allow to properly install split each service
FROM base AS pnpm
WORKDIR /usr/src

COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./

RUN corepack enable && corepack install

# Install node-canvas build dependencies
# see https://github.com/Automattic/node-canvas/issues/866
RUN apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev pixman-dev librsvg-dev

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm ci

COPY . .

# endregion
# ---
# region Database

# Prepare dependencies for database client
FROM pnpm AS database-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter @ezreeport/database /usr/build/database/dev
# ---
# Generate prisma client using dev dependencies
FROM pnpm AS database-prisma
WORKDIR /usr/build/database/dev

# Install prisma dependencies
RUN apk add --no-cache --update python3 \
  && ln -sf python3 /usr/bin/python

COPY --from=database-pnpm /usr/build/database/dev .

# Shared TS config
COPY ./tsconfig.json /usr/build/tsconfig.json

# Generate prisma-client
RUN pnpm run db:generate
# ---
# Final image to run migrations
FROM database-prisma AS migrate

CMD [ "npm", "run", "db:deploy" ]

# endregion
# ---
# region API

# Prepare prod dependencies for API
FROM pnpm AS api-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter ezreeport-report --prod /usr/build/api/prod

COPY --from=database-prisma /usr/build/database/dev/.prisma /usr/build/api/prod/node_modules/@ezreeport/database/.prisma

# ---
# Final image to run API service
FROM base AS api
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/api

# Shared TS config
COPY ./tsconfig.json /usr/tsconfig.json

COPY --from=api-pnpm /usr/build/api/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Worker

# Prepare prod dependencies for worker
FROM pnpm AS worker-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter ezreeport-worker --prod /usr/build/worker/prod

# ---
# Final image to run worker service
FROM base AS worker
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/worker

# Install node-canvas dependencies
RUN apk add --no-cache cairo jpeg pango pixman librsvg

# Shared TS config
COPY ./tsconfig.json /usr/tsconfig.json

COPY --from=worker-pnpm /usr/build/worker/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Scheduler

# Prepare prod dependencies for scheduler
FROM pnpm AS scheduler-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter ezreeport-scheduler --prod /usr/build/scheduler/prod

COPY --from=database-prisma /usr/build/database/dev/.prisma /usr/build/scheduler/prod/node_modules/@ezreeport/database/.prisma

# ---
# Final image to run scheduler service
FROM base AS scheduler
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/scheduler

# Shared TS config
COPY ./tsconfig.json /usr/tsconfig.json

COPY --from=scheduler-pnpm /usr/build/scheduler/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Mail

# Prepare prod dependencies for mail
FROM pnpm AS mail-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter ezreeport-mail --prod /usr/build/mail/prod

# ---
# Final image to run mail service
FROM base AS mail
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/mail

# Shared TS config
COPY ./tsconfig.json /usr/tsconfig.json

COPY --from=mail-pnpm /usr/build/mail/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Files

# Prepare prod dependencies for files
FROM pnpm AS files-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter ezreeport-files --prod /usr/build/files/prod

# ---
# Final image to run files service
FROM base AS files
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/files

# Shared TS config
COPY ./tsconfig.json /usr/tsconfig.json

COPY --from=files-pnpm /usr/build/files/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region All In One

# Final image to run all services
FROM base AS aio
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build

COPY ./services/ecosystem.config.js .
RUN npm install -g pm2@^7.0.3 tsx@^4.23.1

RUN apk add --no-cache cairo jpeg pango pixman librsvg

# Shared TS config
COPY ./tsconfig.json /usr/tsconfig.json

COPY --from=api /usr/build/api ./report
COPY --from=worker /usr/build/worker ./worker
COPY --from=scheduler /usr/build/scheduler ./scheduler
COPY --from=mail /usr/build/mail ./mail
COPY --from=files /usr/build/files ./files

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD ["pm2-runtime", "ecosystem.config.js"]

# endregion
