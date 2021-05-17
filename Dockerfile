FROM node:alpine
WORKDIR /app

COPY ./package.json ./
COPY ./yarn.lock ./

RUN \
  apk update && \
  apk add --no-cache \
    udev \
    ttf-freefont && \
  mkdir -p /usr/share/fonts/nanumfont && \
  wget http://cdn.naver.com/naver/NanumFont/fontfiles/NanumFont_TTF_ALL.zip && \
  unzip NanumFont_TTF_ALL.zip -d /usr/share/fonts/nanumfont && \
  fc-cache -f -v && \
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
    curl \
    tzdata && \
  cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
  echo $TZ > /etc/timezone && \
  yarn install
COPY . .

ENV LANG=ko_KR.UTF-8 \
    LANGUAGE=ko_KR.UTF-8

CMD ["yarn", "start"]