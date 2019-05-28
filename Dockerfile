FROM node:11
WORKDIR /app

ADD package.json /app/
ADD package-lock.json /app/

RUN npm install

ADD ./ /app/

ENTRYPOINT ["/bin/bash"]

ENV PORT 8080
