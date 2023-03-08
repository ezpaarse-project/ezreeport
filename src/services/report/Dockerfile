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
# npm ci isn't possible because project uses npm workspaces
RUN npm i --omit=dev

# ---- Build prisma-client

FROM node:18.14.0-alpine3.17 AS prisma
LABEL maintainer="ezTeam <ezteam@couperin.org>"

WORKDIR /usr/build/prisma

ENV NODE_ENV=production

COPY ./prisma ./prisma
COPY ./package.json ./
# Getting node_modules from previous stage to avoid rebuilding node-canvas
COPY --from=npm-builder /usr/build/report/node_modules ./node_modules

# Install dev dependencies
# npm ci isn't possible because project uses npm workspaces
RUN npm i \
	# Adding non critical dependencies but still required for generating prisma-client
	#? Why it's not included with npm i ?!
	&& npm i -g prisma-erd-generator @mermaid-js/mermaid-cli

# Generate prisma-client
RUN DISABLE_ERD=true npx prisma generate

# ---- Prod image

FROM node:18.14.0-alpine3.17
LABEL maintainer="ezTeam <ezteam@couperin.org>"
EXPOSE 8080

WORKDIR /usr/src/report

# fixme: app not starting
ENV NODE_ENV=production

COPY ./ ./
COPY --from=prisma /usr/build/prisma/.prisma ./.prisma
COPY --from=npm-builder /usr/build/report/node_modules ./node_modules

RUN apk add --no-cache cairo jpeg pango giflib

CMD [ "npm", "run", "start" ]