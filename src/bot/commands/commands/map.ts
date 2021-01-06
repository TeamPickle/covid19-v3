import { createCanvas, loadImage } from 'canvas';
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

const deg2num = (longDeg: number, latDeg: number, zoom: number) => {
  if (zoom < 0 || zoom > 21) throw new Error('zoom must be grater than or equal to 0 and less than or equal to 21');
  const latRad = latDeg * (Math.PI / 180);
  const n = 2 ** zoom;
  const xtile = ((longDeg + 180) / 360) * n;
  const ytile = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n;
  return [xtile, ytile] as const;
};

const deg2numByOffset = (
  longDeg: number, latDeg: number, zoom: number, offset: number, imageSize: number = 256,
) => {
  const [xtile, ytile] = deg2num(longDeg, latDeg, zoom);
  return [
    Math.floor((xtile - Math.floor(xtile) + offset) * imageSize),
    Math.floor((ytile - Math.floor(ytile) + offset) * imageSize),
  ] as const;
};

const parseBoundary = (boundary: Boundary): ParsedBoundary => ({
  maxX: +boundary.maxX,
  maxY: +boundary.maxY,
  minX: +boundary.minX,
  minY: +boundary.minY,
});

const getCenterOfCoordinate = (boundary: ParsedBoundary) => (
  [(boundary.minX + boundary.minY) / 2, (boundary.minY + boundary.maxY) / 2] as const
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

const getMapImage = async (
  xtile: number,
  ytile: number,
  zoom: number,
  numberOfXtile: number,
  numberOfYtile: number,
  mapType: MapType,
  mapVersion: number = 1608790831,
) => {
  const images = await Promise.all(
    [...Array(numberOfYtile)].map((_, y) => (
      Promise.all(
        [...Array(numberOfXtile)].map((_, x) => loadImage(`https://map.pstatic.net/nrb/styles/${mapType}/${mapVersion}/${zoom}/${x + xtile}/${y + ytile}.png?mt=bg.ol.lko`)),
      )
    )),
  );

  const imageSize = images[0][0].width;

  const canvas = createCanvas(
    imageSize * numberOfXtile, imageSize * numberOfYtile,
  );
  const ctx = canvas.getContext('2d');
  images.forEach((y, yIndex) => {
    y.forEach((image, xIndex) => {
      ctx.drawImage(image, xIndex * imageSize, yIndex * imageSize);
    });
  });
  return canvas;
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
    const image = await getMapImage(xtile, ytile, zoom, 5, 5, MapType.BASIC);
    return msg.channel.send(new MessageAttachment(image.toBuffer()));
  }
}
