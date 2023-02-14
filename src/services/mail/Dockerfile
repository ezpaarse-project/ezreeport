FROM node:18.14.0-alpine3.17
LABEL maintainer="ezTeam <ezteam@couperin.org>"

WORKDIR /usr/src/report

COPY . ./

# Update APK registry
RUN apk update \
	&& apk upgrade -U -a

# Install service dependecies
RUN npm i --omit=dev

CMD [ "npm", "run", "start" ]