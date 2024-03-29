# 코로나19 알림봇

코로나19와 관련된 정보를 제공하는 디스코드 봇 입니다.

[![Forum](https://discordapp.com/api/guilds/680026950064275466/widget.png)](http://forum.tpk.kr)
[![docker hub](https://img.shields.io/docker/pulls/teampickle/covid19bot)](https://hub.docker.com/r/teampickle/covid19bot)

지금바로 초대하기 ===> http://covid19bot.tpk.kr

## 명령어 목록

### 주 명령어

- !현황 (시/도)
- !현황 [국가]
- !국내현황
- !세계현황

### 설정 및 옵션

- !위치설정
- !채널설정
- !접두사설정 [접두사]
- !접두사초기화
- !현황알림

## 소스를 실행하는 방법

### 개발 버전

코드를 실행하기 전에
[node.js](https://nodejs.org/),
[yarn](https://yarnpkg.com/),
[mongodb](https://docs.mongodb.com/manual/)
가 필요합니다.

이들이 설치가 되었으면

`.env.example` 파일을 보고 형식에 맞춰서 같은 디렉토리에 `.env` 파일을 작성하면 됩니다.

그 후에 아래 명령어를 차례대로 입력하면 개발 버전으로 실행이 됩니다.

```sh
yarn
yarn dev
```

### 배포 버전

배포를 하기 위해서는
[docker](https://docs.docker.com/engine/)
가 필요합니다.

.env파일을 작성하셔서 실행시에 `--env-file .env`와 같이 플래그를 넣거나, `-e` 로 직접 하나씩 기재해도 됩니다.

또는 docker hub에 있는 이미지를 사용해도 됩니다.
