FROM node:18.14.0-alpine3.17 as builder
LABEL maintainer="ezTeam <ezteam@couperin.org>"

WORKDIR /usr/build/report

ENV NODE_ENV=production

COPY ./package.json ./
COPY ./prisma ./prisma

# Update APK registry
RUN apk update \
	&& apk upgrade -U -a \
	# Install node-canvas build dependencies
	# see https://github.com/Automattic/node-canvas/issues/866
	&& apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Install service dependecies (it will build node-canvas)
# npm ci isn't possible because project uses npm workspaces
RUN npm i --omit=dev \
	# Install prisma dependecies
	&& npm i -g prisma prisma-erd-generator @mermaid-js/mermaid-cli

# Generate prisma-client
RUN DISABLE_ERD=true prisma generate

# ----

FROM node:18.14.0-alpine3.17
LABEL maintainer="ezTeam <ezteam@couperin.org>"
EXPOSE 8080

WORKDIR /usr/src/report

# fixme: app not starting
ENV NODE_ENV=production

COPY . ./
COPY --from=builder /usr/build/report/.prisma ./.prisma
COPY --from=builder /usr/build/report/node_modules ./node_modules

RUN apk add --no-cache cairo jpeg pango giflib

CMD [ "npm", "run", "start" ]