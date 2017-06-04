FROM node:7.4-alpine

RUN apk add -t .gyp --no-cache git python g++ make \
    && npm install -g ethereumjs-testrpc@3.0.x \
    && apk del .gyp

EXPOSE 8545
ENTRYPOINT ["testrpc"]
