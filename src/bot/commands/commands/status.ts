import { oneLine, stripIndents } from 'common-tags';
import { MessageAttachment, MessageEmbed, TextChannel } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import fetch from 'node-fetch';
import { graphChannelId } from '@/config.json';
import Charts from '@src/bot/models/chartModel';
import { ThenArg } from '@src/types/util';
import Graphs from '@src/bot/models/graphModel';
import makeGraph from '@src/bot/util/graph';
import disaster from '@src/bot/data/commands/disaster';
import { parseBoard, format, increase } from '@src/bot/util/board';
import send from '@src/bot/util/send';

const parseNumber = (i: string) => +i.replace(/(,| )/g, '');
const formatDate = (date: Date) => oneLine`
  ${date.getFullYear()}년
  ${(date.getMonth() + 1).toString().padStart(2, '0')}월
  ${date.getDate().toString().padStart(2, '0')}일
  ${date.getHours().toString().padStart(2, '0')}시
`;

const parseNcov = async () => {
  const ncov = await (await fetch('http://ncov.mohw.go.kr/bdBoardList_Real.do?brdGubun=11')).text();

  const accData = ncov.matchAll(/>누적<[\s\S]*?>.*?([\d,]+)</g);
  const deltaData = ncov.matchAll(/>전일대비<[\s\S]*?>.*?([\d,]+)</g);
  const overseaConfirmedDelta = ncov.match(/>해외유입<[\s\S]*?>([\d,]+)</)?.[1];
  const testing = ncov.match(/>누적 검사현황[\s\S]*?(<td>[\s\S]*?){7}([\d,]+)/)?.[2];
  const date = ncov.match(/t_date">\(([\d.]+)/)?.[1];

  if (!deltaData || !accData || !overseaConfirmedDelta || !testing || !date) return null;

  const [confirmedAcc, releasedAcc, activeAcc, deathAcc] = [...accData].map((i) => (
    parseNumber(i[1])
  ));
  const [confirmedDelta, releasedDelta, activeDelta, deathDelta] = [...deltaData].map((i) => (
    parseNumber(i[1])
  ));

  const parsedDate = new Date(`${date}Z`);
  parsedDate.setFullYear(new Date().getFullYear());

  return {
    confirmedAcc,
    confirmedDelta,
    overseaConfirmedDelta: parseNumber(overseaConfirmedDelta),

    releasedAcc,
    releasedDelta,

    activeAcc,
    activeDelta,

    deathAcc,
    deathDelta,

    testing: parseNumber(testing),
    date: parsedDate,
  };
};

const isSameWithLatest = async (data: ThenArg<ReturnType<typeof parseNcov>>) => {
  const chart = await Charts.findOne().sort({ $natural: -1 });
  if (!data || !chart) return false;
  return (
    data.date.getTime() === chart.date.getTime()
    && data.activeAcc === chart.active
    && data.confirmedAcc === chart.confirmedAcc
    && data.deathAcc === chart.deathAcc
    && data.releasedAcc === chart.releasedAcc
    && data.confirmedDelta === chart.confirmed
    && data.releasedDelta === chart.released
    && data.deathDelta === chart.death
  );
};

const makeEmbedWithData = async (data: NonNullable<ThenArg<ReturnType<typeof parseNcov>>>) => {
  const graphUrl = (await Graphs.findOne({}, {}, { sort: { createdAt: -1 } }))?.url;
  const embed = new MessageEmbed();
  embed
    .setTitle(`대한민국 코로나19 확진 정보 (${formatDate(data.date)} 기준)`)
    .setDescription(stripIndents`
      <:nujeok:687907310923677943> **확진자** : ${data.confirmedAcc}(${increase(data.confirmedDelta)}, 해외유입 +${data.overseaConfirmedDelta})
      <:wanchi:687907312052076594> **완치** : ${data.releasedAcc}(${increase(data.releasedDelta)}) - ${Math.round((data.releasedAcc / data.confirmedAcc) * 100)}%
      <:samang:687907312123510817> **사망** : ${data.deathAcc}(${increase(data.deathDelta)}) - ${Math.round((data.deathAcc / data.confirmedAcc) * 100)}%

      <:chiryojung:711728328985411616> **치료중** : ${data.activeAcc}(${increase(data.activeDelta)})
      <:geomsa:687907311301296146> **검사중** : ${data.testing}
    `)
    .setColor(0x006699)
    .setFooter('지자체에서 자체 집계한 자료와는 차이가 있을 수 있습니다.');

  if (graphUrl) {
    embed.setImage(graphUrl);
  }
  return embed;
};

const parseLocalData = async () => {
  const data = await (await fetch('http://ncov.mohw.go.kr/bdBoardList_Real.do?brdGubun=13')).text();

  return [...data.matchAll(
    /<tr>.*row">(.*?)<.*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,.]*)/g,
  )].map(([, location, ...match]) => (
    [location, ...match.map(parseNumber)] as const
  )).reduce((prev, curr) => ({
    ...prev,
    [curr[0] as keyof typeof prev]: {
      confirmedDelta: curr[1],
      overseaConfirmedDelta: curr[3],
      confirmedAcc: curr[4],
      activeAcc: curr[5],
      releasedAcc: curr[6],
      deathAcc: curr[7],
      incidence: curr[8],
    },
  }), {} as {
    [key in Exclude<typeof disaster.disasterRegion[number], '전국'> ]: {
      confirmedDelta: number;
      overseaConfirmedDelta: number;

      confirmedAcc: number;
      activeAcc: number;

      releasedAcc: number;
      deathAcc: number;

      incidence: number;
    }
  });
};

type Value<T> = T[keyof T];

const makeEmbedWithLocalData = (
  location: string, data: Value<ThenArg<ReturnType<typeof parseLocalData>>>,
) => {
  const embed = new MessageEmbed();
  embed
    .setTitle(`시/도 확진자 수 조회 - ${location}`)
    .setDescription(stripIndents`
      <:nujeok:687907310923677943> **확진자** : ${data.confirmedAcc}명(${increase(data.confirmedDelta)})
      <:chiryojung:711728328985411616> **치료중** : ${data.activeAcc}명
      <:wanchi:687907312052076594> 완치 : ${data.releasedAcc}명
      <:samang:687907312123510817> 사망 : ${data.deathAcc}명
    `);
  return embed;
};

export default class StatusCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'status',
      aliases: ['현황'],
      description: 'status command',
      group: 'commands',
      memberName: 'status',
      args: [{
        key: 'location',
        prompt: '',
        type: 'string',
        default: '',
      }],
    });
  }

  async run(msg: CommandoMessage, { location }: { location: string }) {
    if (location) {
      const data = await parseBoard();
      if (data) {
        // eslint-disable-next-line no-nested-ternary
        const country = location === '오스트레일리아' ? '호주'
          : location === '우리나라' || location === '한국' ? '대한민국' : location;
        const cc = Object.entries(data.i18nAll.ko).find(([k, v]) => (
          v === country && k.length === 2
        ))?.[0];

        if (cc) {
          const status = data.statGlobalNow.find((stat) => stat.cc === cc);
          if (status) {
            const embed = new MessageEmbed();
            embed
              .setTitle(`${status.flag} 국가별 현황 - ${location}`)
              .setDescription(stripIndents`
                ${oneLine`
                  <:nujeok:687907310923677943> 확진자 :
                  ${format(status.confirmed)}명(${increase(status.confirmed - status.confirmed_prev)})
                `}
                ${oneLine`
                  <:wanchi:687907312052076594> 완치 :
                  ${format(status.released)}명(${increase(status.released - status.released_prev)}) -
                  ${Math.round((status.released / status.confirmed) * 100)}%
                `}
                ${oneLine`
                  <:samang:687907312123510817> 사망 :
                  ${format(status.death)}명(${increase(status.death - status.death_prev)}) -
                  ${Math.round((status.death / status.confirmed) * 100)}%
                `}
              `)
              .setColor(0x00bfff);
            return msg.channel.send(embed);
          }
        }
      }

      const localData = await parseLocalData();
      if (!Object.keys(localData).includes(location)) {
        return msg.channel.send(stripIndents`
          지원하지 않는 지역입니다.
          다음 중 하나를 입력해 주세요: \`${Object.keys(localData).join(' ')}\` 또는 \`국가 이름\`
        `);
      }
      return msg.channel.send(
        makeEmbedWithLocalData(location, localData[location as keyof typeof localData]),
      );
    }

    const data = await parseNcov();
    if (!data) return null;

    if (!await isSameWithLatest(data)) {
      await Charts.create({
        date: data.date,
        active: data.activeAcc,
        confirmedAcc: data.confirmedAcc,
        deathAcc: data.deathAcc,
        releasedAcc: data.releasedAcc,
        confirmed: data.confirmedDelta,
        death: data.deathDelta,
        released: data.releasedDelta,
      });

      const graphChannel = this.client.channels.cache.get(graphChannelId);
      if (graphChannel && graphChannel.type === 'text') {
        const graphMessage = await (graphChannel as TextChannel).send(
          new MessageAttachment(await makeGraph()),
        );
        await Graphs.create({
          url: graphMessage.attachments.first()?.url,
        });
        const embed = await makeEmbedWithData(data);
        embed.setTitle('🔄 현황 변경 안내');
        send(this.client, embed).then(({ toSendSize, sended }) => {
          (graphChannel as TextChannel).send(`${sended}/${toSendSize}`);
        });
      }
    }

    return msg.channel.send(await makeEmbedWithData(data));
  }
}
