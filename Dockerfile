FROM node:alpine
WORKDIR /app

COPY ./package.json ./
COPY ./yarn.lock ./

RUN \
  apk update && \
  apk add --no-cache \
    python \
    g++ \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    curl && \
  yarn install
COPY . .

CMD ["yarn", "start"]