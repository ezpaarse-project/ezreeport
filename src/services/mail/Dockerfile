FROM node:18.17.0-alpine3.18
LABEL maintainer="ezTeam <ezteam@couperin.org>"

WORKDIR /usr/src/report

# Update APK registry
RUN apk update \
	&& apk upgrade -U -a

# Install service dependecies
COPY package*.json ./
RUN npm ci --omit=dev
COPY . ./

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1
CMD [ "npm", "run", "start" ]