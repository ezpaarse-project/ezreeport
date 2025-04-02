# region Common

# Base image for node, enable usage of pnpm and allow to run apps
FROM node:20.11.1-alpine3.19 AS base
LABEL maintainer="ezTeam <ezteam@couperin.org>"

ENV HUSKY=0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Update APK registry
RUN apk update \
  && apk upgrade -U -a

RUN corepack enable

# endregion
# ---
# region PNPM

# Base image for pnpm, allow to properly install dependencies
FROM base AS pnpm
WORKDIR /usr/build

# Install node-canvas build dependencies
# see https://github.com/Automattic/node-canvas/issues/866
RUN apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev pixman-dev

COPY  ./.npmrc ./package.json ./pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i --frozen-lockfile

COPY . .

# endregion
# ---
# region API

# Generate prisma client using dev dependencies
FROM pnpm AS api-prisma

RUN pnpm deploy --filter ezreeport-report ./api-dev
WORKDIR /usr/build/api-dev

# Install prisma dependencies
RUN apk add --no-cache --update python3 \
	&& ln -sf python3 /usr/bin/python

# Generate prisma-client
RUN npx prisma generate

# ---
# Prepare prod dependencies for API
FROM pnpm AS api-pnpm

RUN pnpm deploy --filter ezreeport-report --prod ./api

# ---
# Final image to run API service
FROM base AS api
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/api

COPY --from=api-pnpm /usr/build/api .
COPY --from=api-prisma /usr/build/api-dev/.prisma ./.prisma

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Worker

# Prepare prod dependencies for WORKER
FROM pnpm AS worker-pnpm

RUN pnpm deploy --filter ezreeport-worker --prod ./worker

# ---
# Final image to run API service
FROM base AS worker
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/worker

# Install node-canvas dependencies
RUN apk add --no-cache cairo jpeg pango pixman

COPY --from=worker-pnpm /usr/build/worker .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Scheduler

# Prepare prod dependencies for scheduler
FROM pnpm AS scheduler-pnpm

RUN pnpm deploy --filter ezreeport-scheduler --prod ./scheduler

# ---
# Final image to run scheduler service
FROM base AS scheduler
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/scheduler

COPY --from=scheduler-pnpm /usr/build/scheduler .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Mail

# Prepare prod dependencies for mail
FROM pnpm AS mail-pnpm

RUN pnpm deploy --filter ezreeport-mail --prod ./mail

# ---
# Final image to run mail service
FROM base AS mail
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/mail

COPY --from=mail-pnpm /usr/build/mail .

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
RUN npm install -g pm2 tsx

COPY --from=api /usr/build/api ./report
COPY --from=worker /usr/build/worker ./worker
COPY --from=scheduler /usr/build/scheduler ./scheduler
COPY --from=mail /usr/build/mail ./mail

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD ["pm2-runtime", "ecosystem.config.js"]

# endregion
# ---
# region SDK

# Prepare SDK to be used in other images
FROM pnpm AS sdk-pnpm

RUN pnpm run --filter @ezpaarse-project/ezreeport-sdk-js build
RUN pnpm deploy --filter @ezpaarse-project/ezreeport-sdk-js --prod ./sdk

# endregion
# ---
# region Vue

# Prepare Vue to be used in other images
FROM pnpm AS vue-pnpm

RUN pnpm run --filter @ezpaarse-project/ezreeport-vue build
RUN pnpm deploy --filter @ezpaarse-project/ezreeport-vue --prod ./vue

# endregion
# ---
# region Vue Documentation

# Build vue documentation
FROM pnpm AS vuedoc-builder

COPY --from=sdk-pnpm /usr/build/sdk ./sdk
# Not using vue-pnpm cause we need dev dependencies to build the documentation
RUN pnpm deploy --filter @ezpaarse-project/ezreeport-vue ./vue
WORKDIR /usr/build/vue

ARG REPORT_TOKEN="changeme" \
   REPORT_API="http://localhost:8080/"

ENV VITE_EZR_TOKEN=${REPORT_TOKEN} \
    VITE_EZR_API=${REPORT_API}

RUN npm run build:story

# ---
# Final image to run vue documentation on nginx
FROM nginx:stable-alpine AS vuedoc
WORKDIR /usr/share/nginx/html

COPY ./config/vue-ngnix.types /etc/nginx/mime.types
COPY --from=vuedoc-builder /usr/build/vue/storybook-static ./

EXPOSE 80

# endregion
