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

CMD [ "npm", "run", "start" ]