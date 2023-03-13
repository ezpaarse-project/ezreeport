# ---- Build prod dependencies (like node-canvas)

FROM node:18.14.0-alpine3.17 AS npm-builder
LABEL maintainer="ezTeam <ezteam@couperin.org>"

WORKDIR /usr/build/report

ENV NODE_ENV=production

COPY ./package.json ./

# Update APK registry
RUN apk update \
	&& apk upgrade -U -a \
	# Install node-canvas build dependencies
	# see https://github.com/Automattic/node-canvas/issues/866
	&& apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Install service dependencies (it will build node-canvas)
COPY package*.json ./
RUN npm ci --omit=dev
COPY . ./

# ---- Build prisma-client

FROM node:18.14.0-alpine3.17 AS prisma
LABEL maintainer="ezTeam <ezteam@couperin.org>"

WORKDIR /usr/build/prisma

ENV NODE_ENV=production

# Getting node_modules from previous stage to avoid rebuilding node-canvas
COPY --from=npm-builder /usr/build/report/node_modules ./node_modules

# Install dev dependencies
COPY ./package*.json ./
RUN npm ci
COPY ./prisma ./prisma

# Generate prisma-client
RUN npx prisma generate

# ---- Prod image

FROM node:18.14.0-alpine3.17
LABEL maintainer="ezTeam <ezteam@couperin.org>"
EXPOSE 8080

WORKDIR /usr/src/report

ENV NODE_ENV=production

COPY . ./
COPY --from=prisma /usr/build/prisma/.prisma ./.prisma
COPY --from=npm-builder /usr/build/report/node_modules ./node_modules

RUN apk add --no-cache cairo jpeg pango giflib

CMD [ "npm", "run", "start" ]