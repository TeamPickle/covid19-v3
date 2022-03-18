import path from 'path';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';
import { Client, MessageAttachment } from 'discord.js';
import graphicData, { locations } from '@src/bot/data/commands/graphic';
import { ThenArg } from '@src/types/util';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';

const graphicDataPath = path.join(__dirname, '../../data/commands/graphic/');

const parseNcov = async () => {
  const ncov = await (
    await fetch('http://ncov.mohw.go.kr/bdBoardList_Real.do?brdGubun=13')
  ).text();
  const confirmed = [...ncov.matchAll(/l_type1">([\d,]+)/g)]
    .slice(0, -1)
    .map((i) => +i[1].replace(/,/g, ''));
  const confirmedAcc = [...ncov.matchAll(/s_type1">([\d,]+)/g)]
    .slice(0, -1)
    .map((i) => +i[1].replace(/,/g, ''));

  const data = Object.fromEntries(
    locations.map((v, idx) => [
      v,
      {
        confirmed: confirmed[idx],
        confirmedAcc: confirmedAcc[idx],
      },
    ]),
  );

  return data as Record<
    typeof locations[number],
    typeof data[keyof typeof data]
  >;
};

const getPrefix = (per: number) => {
  if (per > 20) return '';
  if (per > 1.5) return 'h';
  if (per > 0.5) return 'hh';
  return 'hhh';
};

const makeImage = async (data: ThenArg<ReturnType<typeof parseNcov>>) => {
  const width = 1665;
  const height = 1125;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.fillStyle = '#1e1e1e';
  context.fillRect(0, 0, width, height);

  context.drawImage(
    await loadImage(path.join(graphicDataPath, '/bg.png')),
    0,
    0,
  );

  await Promise.all(
    locations.slice(1).map(async (v) => {
      const per = (data[v].confirmed / data.합계.confirmed) * 100;

      const prefix = getPrefix(per);
      const image = await loadImage(
        path.join(graphicDataPath, `/${prefix}${v}.png`),
      );
      context.drawImage(image, graphicData[v].x + 358, graphicData[v].y + 44);
    }),
  );

  context.drawImage(
    await loadImage(path.join(graphicDataPath, '/k.png')),
    213,
    10,
  );

  context.textBaseline = 'hanging';

  locations.slice(1).forEach((v) => {
    context.font = 'bold 48px NotoSans';
    const measure = context.measureText(`${data[v].confirmed}`);
    context.textAlign = graphicData[v].align;
    context.fillText(
      `${data[v].confirmed}`,
      graphicData[v].textX,
      graphicData[v].textY,
    );
    context.font = '24px NotoSans';
    context.fillText(
      `(총 ${data[v].confirmedAcc})`,
      graphicData[v].align === 'left'
        ? graphicData[v].textX + measure.width + 10
        : graphicData[v].textX - measure.width - 10,
      graphicData[v].textY,
    );
  });

  return canvas.toBuffer();
};

export default class GraphicCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'graphic',
      aliases: ['국내현황', '지역현황'],
      description: 'graphic command',
    });
  }

  runCommand = async (msg: ReceivedMessage) =>
    msg.respond({
      attachments: [new MessageAttachment(await makeImage(await parseNcov()))],
    });
}
