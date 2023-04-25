FROM node:18.16.0-alpine3.17
LABEL maintainer="ezTeam <ezteam@couperin.org>"

WORKDIR /usr/src/report

# Update APK registry
RUN apk update \
	&& apk upgrade -U -a

# Install service dependecies
COPY package*.json ./
RUN npm ci --omit=dev
COPY . ./

CMD [ "npm", "run", "start" ]