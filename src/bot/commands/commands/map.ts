import { Canvas, createCanvas, Image, loadImage } from 'canvas';
import { Client, MessageAttachment } from 'discord.js';
import fetch from 'node-fetch';
import { ThenArg } from '@src/types/util';
import Locations from '@src/bot/models/locationModel';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';

enum MapType {
  SATELLITE = 'satellite',
  TERRAIN = 'terrain',
  BASIC = 'basic',
}

interface Boundary {
  minX: string;
  minY: string;
  maxX: string;
  maxY: string;
}

interface ParsedBoundary {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface SearchData {
  result: {
    type: 'address' | 'place' | 'all';
    address: {
      subType: 'jibun-address' | 'road-address';
      jibunsAddress: {
        list: {
          id: string;
          boundary: Boundary | null;
        }[];
      };
      roadAddress: {
        list: {
          id: string;
          boundary: Boundary | null;
        }[];
      };
    };
    place: {
      boundary: [string, string, string, string];
    };
  };
}

interface AddressBoundaryData {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    bbox: [number, number, number, number];
    geometry:
      | {
          type: 'MultiPolygon';
          coordinates: [number, number][][][];
        }
      | {
          type: 'Polygon';
          coordinates: [number, number][][];
        };
  }[];
}

interface CoronaData {
  data: {
    _id: string;
    region: string;
    visitedDate: string;
    latlng: string;
    address: string;
    placeEnglish: string;
    place: string;
    createDate: string;
  }[];
}

interface ParsedCoronaData {
  visitedDate: Date;
  lat: number;
  long: number;
}

const getLocation = async (userId: string, query: string) => {
  if (query) return query;
  const row = await Locations.findById(userId);
  return row?.location || '';
};

/**
 * tile position from coordinate
 * @param longDeg longitude
 * @param latDeg latitude
 * @param zoom zoom level
 * @returns [number, number] float
 */
const deg2num = (longDeg: number, latDeg: number, zoom: number) => {
  if (zoom < 0 || zoom > 21)
    throw new Error(
      'zoom must be grater than or equal to 0 and less than or equal to 21',
    );
  const latRad = latDeg * (Math.PI / 180);
  const n = 2 ** zoom;
  const xtile = ((longDeg + 180) / 360) * n;
  const ytile = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n;
  return [xtile, ytile] as const;
};

const deg2numByOffset = (
  longDeg: number,
  latDeg: number,
  zoom: number,
  center: [number, number] = [0, 0],
  offset: number = 2,
  imageSize: number = 256,
) => {
  const [xtile, ytile] = deg2num(longDeg, latDeg, zoom);
  return [
    Math.floor((xtile - Math.floor(center[0]) + offset) * imageSize),
    Math.floor((ytile - Math.floor(center[1]) + offset) * imageSize),
  ] as const;
};

const parseBoundary = (boundary: Boundary): ParsedBoundary => ({
  maxX: +boundary.maxX,
  maxY: +boundary.maxY,
  minX: +boundary.minX,
  minY: +boundary.minY,
});

const getCenterOfCoordinate = (boundary: ParsedBoundary) =>
  [
    (boundary.minX + boundary.maxX) / 2,
    (boundary.minY + boundary.maxY) / 2,
  ] as const;

const getZoomByBoundary = (
  boundary: ParsedBoundary,
  amountOfSideTile: number,
) => {
  for (let zoom = 21; zoom > 5; zoom -= 1) {
    const [left, top] = deg2num(+boundary.minX, +boundary.minY, zoom);
    const [right, bottom] = deg2num(+boundary.maxX, +boundary.maxY, zoom);
    if (
      right - left < amountOfSideTile - 1 &&
      bottom - top < amountOfSideTile - 1
    ) {
      return zoom;
    }
  }
  return 5;
};

const getMapVersion = async () => {
  const response = await fetch(
    'https://map.pstatic.net/nrb/styles/basic.json?fmt=png',
  );
  const data = await response.json();
  return data.version as string;
};

const searchMapByQuery = async (query: string) => {
  const response = await fetch(
    `https://map.naver.com/v5/api/search?caller=pcweb&query=${encodeURIComponent(
      query,
    )}`,
  );
  if (response.status !== 200) return '서버 에러가 발생했습니다.';
  return (await response.json()) as SearchData;
};

const getMapData = async (data: SearchData) => {
  if (data.result.type === 'address') {
    if (data.result.address.subType === 'jibun-address') {
      return {
        id: data.result.address.jibunsAddress.list[0].id,
        boundary: data.result.address.jibunsAddress.list[0].boundary,
      };
    }
    return {
      id: data.result.address.roadAddress.list[0].id,
      boundary: data.result.address.roadAddress.list[0].boundary,
    };
  }

  if (data.result.type === 'place') {
    const { boundary } = data.result.place;
    return {
      boundary: <Boundary>{
        minX: boundary[0],
        maxY: boundary[1],
        maxX: boundary[2],
        minY: boundary[3],
      },
    };
  }

  return null;
};

const getMapImages = async (
  xtile: number,
  ytile: number,
  zoom: number,
  mapVersion: string,
  numberOfXtile: number = 5,
  numberOfYtile: number = 5,
  mapType: MapType = MapType.BASIC,
) => {
  const alignedXtile = Math.floor(xtile - Math.floor(numberOfXtile / 2));
  const alignedYtile = Math.floor(ytile - Math.floor(numberOfYtile / 2));
  return Promise.all(
    [...Array(numberOfYtile)].map((_, y) =>
      Promise.all(
        [...Array(numberOfXtile)].map((_, x) =>
          loadImage(
            `https://map.pstatic.net/nrb/styles/${mapType}/${mapVersion}/${zoom}/${
              x + alignedXtile
            }/${y + alignedYtile}.png?mt=bg.ol.lko`,
          ),
        ),
      ),
    ),
  );
};

const getMapImage = (images: Image[][]) => {
  const imageSize = images[0][0].width;

  const canvas = createCanvas(
    imageSize * images[0].length,
    imageSize * images.length,
  );
  const ctx = canvas.getContext('2d');
  images.forEach((y, yIndex) => {
    y.forEach((image, xIndex) => {
      ctx.drawImage(image, xIndex * imageSize, yIndex * imageSize);
    });
  });
  return canvas;
};

const getAddressBoundary = async (addressId: string, zoom: number) => {
  const response = await fetch(
    `https://map.naver.com/v5/api/wfs/stargate?output=geojson&targetcrs=epsg:4326&codetype=naver&request=codeToFeatures&level=${zoom}&keyword=${addressId}`,
  );
  const data = (await response.json()) as AddressBoundaryData;
  return data.features[0].geometry.type === 'MultiPolygon'
    ? data.features[0].geometry.coordinates.map((e) => e[0])
    : data.features[0].geometry.coordinates;
};

const drawAddressBoundary = (
  canvas: Canvas,
  zoom: number,
  center: [number, number],
  coordss: ThenArg<ReturnType<typeof getAddressBoundary>>,
) => {
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'red';
  coordss.forEach((coords) => {
    ctx.beginPath();
    coords.forEach((coord) => {
      const [x, y] = deg2numByOffset(coord[0], coord[1], zoom, center);
      ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });
};

const getCoronaData = async () => {
  const response = await fetch('https://coroname.me/getdata');
  return (await response.json()) as CoronaData;
};

const parseCoronaData = (data: CoronaData): ParsedCoronaData[] =>
  data.data.map((e) => ({
    visitedDate: new Date(e.visitedDate),
    createDate: new Date(e.createDate),
    lat: +e.latlng.split(', ')[0],
    long: +e.latlng.split(', ')[1],
  }));

const drawCoronaData = (
  canvas: Canvas,
  zoom: number,
  center: [number, number],
  data: ParsedCoronaData[],
) => {
  const ctx = canvas.getContext('2d');
  data.forEach((e) => {
    const delta = Math.floor(
      (new Date().getTime() - e.visitedDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const [x, y] = deg2numByOffset(e.long, e.lat, zoom, center);
    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.arc(x, y, zoom / 2 + 4, 0, 360);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle =
      // eslint-disable-next-line no-nested-ternary
      delta < 1 ? 'red' : delta < 4 ? 'yellow' : 'green';
    ctx.arc(x, y, zoom / 2 + 3, 0, 360);
    ctx.fill();
  });
};

export default class MapCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'map',
      aliases: ['지도'],
      description: 'map command',
    });
  }

  runCommand = async (msg: ReceivedMessage, args: string[]) => {
    const [, _query] = args;
    if (
      msg.channel.type !== 'DM' &&
      this.client.user &&
      !msg.channel
        .permissionsFor(this.client.user)
        ?.has(['SEND_MESSAGES', 'ATTACH_FILES'])
    ) {
      return msg.respond('권한이 없어 명령을 수행할 수 없습니다.');
    }

    const query = await getLocation(msg.author.id, _query);
    if (!query) return msg.respond('지역을 입력해주세요');

    const search = await searchMapByQuery(query);
    if (typeof search === 'string') return msg.respond(search);

    const mapData = await getMapData(search);
    if (mapData === null) return msg.respond('해당 지역을 찾을 수 없습니다.');
    if (mapData.boundary === null)
      return msg.respond('검색결과가 없습니다. 좀더 넓은 범위로 검색해주세요.');

    const boundary = parseBoundary(mapData.boundary);
    const [x, y] = getCenterOfCoordinate(boundary);
    const zoom = getZoomByBoundary(boundary, 5);
    const [xtile, ytile] = deg2num(x, y, zoom);
    const mapVersion = await getMapVersion();
    const image = getMapImage(
      await getMapImages(xtile, ytile, zoom, mapVersion),
    );

    if (mapData.id) {
      drawAddressBoundary(
        image,
        zoom,
        [xtile, ytile],
        await getAddressBoundary(mapData.id, zoom),
      );
    }

    drawCoronaData(
      image,
      zoom,
      [xtile, ytile],
      parseCoronaData(await getCoronaData()),
    );
    return msg.respond({
      files: [new MessageAttachment(image.toBuffer())],
    });
  };
}
