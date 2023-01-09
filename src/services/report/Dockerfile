FROM node:18.13.0-alpine3.17
LABEL maintainer="ezTeam <ezteam@couperin.org>"

WORKDIR /usr/src/report

COPY . ./

# Update APK registry
RUN apk update \
	&& apk upgrade -U -a

# Install canvas dependencies
# see https://github.com/Automattic/node-canvas/issues/866
RUN apk add --no-cache build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Install service dependecies
RUN npm ci --omit=dev

EXPOSE 8080

CMD [ "npm", "run", "start" ]