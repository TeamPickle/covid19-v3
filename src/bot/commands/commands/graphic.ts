import path from 'path';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';
import { MessageAttachment } from 'discord.js';
import graphicData, { locations } from '@src/bot/data/commands/graphic';
import { ThenArg } from '@src/types/util';

const graphicDataPath = path.join(__dirname, '../../data/commands/graphic/');

const parseNcov = async () => {
  const ncov = await (await fetch('http://ncov.mohw.go.kr/bdBoardList_Real.do?brdGubun=13')).text();
  const confirmed = [...ncov.matchAll(/l_type1">([\d,]+)/g)].slice(0, -1).map((i) => +i[1].replace(/,/g, ''));
  const confirmedAcc = [...ncov.matchAll(/s_type1">([\d,]+)/g)].slice(0, -1).map((i) => +i[1].replace(/,/g, ''));

  const data = Object.fromEntries(
    locations.map((v, idx) => [
      v,
      {
        confirmed: confirmed[idx],
        confirmedAcc: confirmedAcc[idx],
      },
    ]),
  );

  return data as Record<typeof locations[number], typeof data[keyof typeof data]>;
};

const makeImage = async (data: ThenArg<ReturnType<typeof parseNcov>>) => {
  const width = 1665;
  const height = 1125;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.fillStyle = '#1e1e1e';
  context.fillRect(0, 0, width, height);

  context.drawImage(await loadImage(path.join(graphicDataPath, '/bg.png')), 0, 0);

  await Promise.all(
    locations.slice(1).map(async (v) => {
      const per = (data[v].confirmed / data.합계.confirmed) * 100;

      // eslint-disable-next-line no-nested-ternary
      const prefix = per > 20 ? ''
        // eslint-disable-next-line no-nested-ternary
        : per > 1.5 ? 'h'
          : per > 0.5 ? 'hh' : 'hhh';
      const image = await loadImage(path.join(graphicDataPath, `/${prefix}${v}.png`));
      context.drawImage(image, graphicData[v].x + 358, graphicData[v].y + 44);
    }),
  );

  context.drawImage(await loadImage(path.join(graphicDataPath, '/k.png')), 213, 10);

  context.textBaseline = 'hanging';

  locations.slice(1).forEach((v) => {
    if (graphicData[v].position === 'right') {
      context.font = 'bold 48px NotoSans';
      context.textAlign = 'left';
      const measure = context.measureText(`${data[v].confirmed}`);
      context.fillText(`${data[v].confirmed}`, graphicData[v].textX, graphicData[v].textY);
      context.font = '24px NotoSans';
      context.fillText(`(총 ${data[v].confirmedAcc})`, graphicData[v].textX + measure.width + 10, graphicData[v].textY);
      return;
    }
    context.font = 'bold 48px NotoSans';
    context.textAlign = 'right';
    const measure = context.measureText(`${data[v].confirmed}`);
    context.fillText(`${data[v].confirmed}`, graphicData[v].textX + 170, graphicData[v].textY);
    context.font = '24px NotoSans';
    context.fillText(`(총 ${data[v].confirmedAcc})`, graphicData[v].textX + 160 - measure.width, graphicData[v].textY);
  });

  return canvas.toBuffer();
};

export default class GraphicCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'graphic',
      aliases: ['국내현황', '지역현황'],
      description: 'graphic command',
      group: 'commands',
      memberName: 'graphic',
    });
  }

  run = async (msg: CommandoMessage) => {
    msg.channel.send(new MessageAttachment(await makeImage(await parseNcov())));
    return null;
  }
}
