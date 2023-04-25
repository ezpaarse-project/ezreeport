# ---- Build prod dependencies (like node-canvas)

FROM node:18.16.0-alpine3.17 AS npm-builder
LABEL maintainer="ezTeam <ezteam@couperin.org>"

WORKDIR /usr/build/report

ENV NODE_ENV=production

# Update APK registry
RUN apk update \
	&& apk upgrade -U -a \
	# Install node-canvas build dependencies
	# see https://github.com/Automattic/node-canvas/issues/866
	&& apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Install service dependencies (it will build node-canvas)
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Build prisma-client

FROM npm-builder AS prisma

RUN apk update \
	&& apk upgrade -U -a \
	&& apk add --no-cache --update python3 \
	&& ln -sf python3 /usr/bin/python

# Install dev dependencies
RUN npm ci
COPY . ./

# Generate prisma-client
RUN npx prisma generate

# ---- Prod image

FROM node:18.16.0-alpine3.17
LABEL maintainer="ezTeam <ezteam@couperin.org>"
EXPOSE 8080

WORKDIR /usr/src/report

ENV NODE_ENV=production

RUN apk add --no-cache cairo jpeg pango giflib

COPY --from=npm-builder /usr/build/report/node_modules ./node_modules
COPY --from=prisma /usr/build/report/.prisma ./.prisma
COPY . ./

CMD [ "npm", "run", "start" ]