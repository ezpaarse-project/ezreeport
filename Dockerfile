FROM node:18.18.2-alpine3.18 AS base
LABEL maintainer="ezTeam <ezteam@couperin.org>"

ENV HUSKY=0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Update APK registry
RUN apk update \
  && apk upgrade -U -a

RUN corepack enable

# ====

FROM base AS pnpm
WORKDIR /usr/build

# Install node-canvas build dependencies
# see https://github.com/Automattic/node-canvas/issues/866
RUN apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev

COPY ./package.json ./pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

RUN pnpm deploy --filter ezreeport-report ./report-dev
RUN pnpm deploy --filter ezreeport-report --prod ./report
RUN pnpm deploy --filter ezreeport-mail --prod ./mail
RUN pnpm deploy --filter @ezpaarse-project/ezreeport-sdk-js --prod ./sdk
RUN pnpm deploy --filter @ezpaarse-project/ezreeport-vue ./vue

# ==== REPORT

FROM base as report-prisma
WORKDIR /usr/build/report-dev

COPY --from=pnpm /usr/build/report-dev .

# Install prisma dependencies
RUN apk add --no-cache --update python3 \
	&& ln -sf python3 /usr/bin/python

# Generate prisma-client
RUN npx prisma generate

FROM base as report
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/report

# Install node-canvas dependencies
RUN apk add --no-cache cairo jpeg pango giflib

COPY --from=pnpm /usr/build/report .
COPY --from=report-prisma /usr/build/report-dev/.prisma ./.prisma

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/ezreeport-report || exit 1

CMD [ "npm", "run", "start" ]

# ==== MAIL

FROM base as mail
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/mail

COPY --from=pnpm /usr/build/mail .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD [ "npm", "run", "start" ]

# ==== VUE DOC

FROM base as vuedoc-builder
WORKDIR /usr/build/vuedoc
ARG AUTH_TOKEN="changeme"
ARG REPORT_API="http://localhost:8080/"
ARG LOGO_URL="https://ezmesure.couperin.org/"

COPY ./src/vue .
COPY --from=pnpm /usr/build/vue/node_modules ./node_modules

ENV VITE_AUTH_TOKEN=${AUTH_TOKEN} \
    VITE_REPORT_API=${REPORT_API} \
    VITE_NAMESPACES_LOGO_URL=${LOGO_URL}

RUN npm run build:docs

FROM nginx:stable-alpine as vuedoc
WORKDIR /usr/share/nginx/html

COPY ./config/vue-ngnix.types /etc/nginx/mime.types
COPY --from=vuedoc-builder /usr/build/vue/storybook-static ./

EXPOSE 80