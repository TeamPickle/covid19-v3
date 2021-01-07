import { Canvas, createCanvas, Image, loadImage } from 'canvas';
import { MessageAttachment } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import fetch from 'node-fetch';

enum MapType {
  SATELLITE ='satellite',
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
    geometry: {
      type: 'MultiPolygon';
      coordinates: [number, number][][][];
    } | {
      type: 'Polygon';
      coordinates: [number, number][][];
    }
  }[];
}

/**
 * 
 * @param longDeg 
 * @param latDeg 
 * @param zoom 
 * @returns [number, number] float
 */
const deg2num = (longDeg: number, latDeg: number, zoom: number) => {
  if (zoom < 0 || zoom > 21) throw new Error('zoom must be grater than or equal to 0 and less than or equal to 21');
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

const getCenterOfCoordinate = (boundary: ParsedBoundary) => (
  [(boundary.minX + boundary.maxX) / 2, (boundary.minY + boundary.maxY) / 2] as const
);

const getZoomByBoundary = (boundary: ParsedBoundary, amountOfSideTile: number) => {
  for (let zoom = 21; zoom > 5; zoom -= 1) {
    const [left, top] = deg2num(+boundary.minX, +boundary.minY, zoom);
    const [right, bottom] = deg2num(+boundary.maxX, +boundary.maxY, zoom);
    if (right - left < amountOfSideTile - 1 && bottom - top < amountOfSideTile - 1) {
      return zoom;
    }
  }
  return 5;
};

const getMapVersion = async () => {
  const response = await fetch('https://map.pstatic.net/nrb/styles/basic.json?fmt=png');
  const data = await response.json();
  return data.version as string;
};

const searchMapByQuery = async (query: string) => {
  const response = await fetch(`https://map.naver.com/v5/api/search?caller=pcweb&query=${encodeURIComponent(query)}`);
  if (response.status !== 200) return '서버 에러가 발생했습니다.';
  return await response.json() as SearchData;
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
  xtile = Math.floor(xtile - Math.floor(numberOfXtile / 2));
  ytile = Math.floor(ytile - Math.floor(numberOfYtile / 2));
  return Promise.all(
    [...Array(numberOfYtile)].map((_, y) => (
      Promise.all(
        [...Array(numberOfXtile)].map((_, x) => loadImage(`https://map.pstatic.net/nrb/styles/${mapType}/${mapVersion}/${zoom}/${x + xtile}/${y + ytile}.png?mt=bg.ol.lko`))
      )
    )),
  );
}

const getMapImage = (images: Image[][]) => {
  const imageSize = images[0][0].width;

  const canvas = createCanvas(
    imageSize * images[0].length, imageSize * images.length,
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
    `https://map.naver.com/v5/api/wfs/stargate?output=geojson&targetcrs=epsg:4326&codetype=naver&request=codeToFeatures&level=${zoom}&keyword=${addressId}`
  );
  const data = await response.json() as AddressBoundaryData;
  return data.features[0].geometry.type === 'MultiPolygon'
    ? data.features[0].geometry.coordinates.map((e) => e[0]) : data.features[0].geometry.coordinates;
};

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

const drawAddressBoundary = (canvas: Canvas, zoom: number, center: [number, number], coordss: ThenArg<ReturnType<typeof getAddressBoundary>>) => {
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

export default class PingCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'map',
      aliases: ['지도'],
      description: 'map command',
      group: 'commands',
      memberName: 'map',
      args: [
        {
          key: 'query',
          prompt: '',
          default: '',
          type: 'string',
        },
      ],
    });
  }

  run = async (msg: CommandoMessage, { query }: { query: string }) => {
    const search = await searchMapByQuery(query);
    if (typeof search === 'string') return msg.channel.send(search);
    const mapData = await getMapData(search);
    if (mapData === null) return msg.channel.send('해당 지역을 찾을 수 없습니다.');
    if (mapData.boundary === null) return msg.channel.send('검색결과가 없습니다. 좀더 넓은 범위로 검색해주세요.');
    const boundary = parseBoundary(mapData.boundary);
    const [x, y] = getCenterOfCoordinate(boundary);
    const zoom = getZoomByBoundary(boundary, 5);
    const [xtile, ytile] = deg2num(x, y, zoom);
    const mapVersion = await getMapVersion();
    const image = getMapImage(await getMapImages(xtile, ytile, zoom, mapVersion));

    if (mapData.id) {
      drawAddressBoundary(image, zoom, [xtile, ytile], await getAddressBoundary(mapData.id, zoom))
    }
    return msg.channel.send(new MessageAttachment(image.toBuffer()));
  }
}