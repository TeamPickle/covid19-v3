import { oneLine, stripIndents } from 'common-tags';
import { MessageAttachment, MessageEmbed, TextChannel } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import dayjs from 'dayjs';
import config from '@src/config';
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
  const ncov = await (
    await fetch('http://ncov.mohw.go.kr/bdBoardList_Real.do?brdGubun=11')
  ).text();

  const accData = ncov.matchAll(/>누적<[\s\S]*?>.*?([\d,]+)</g);
  const deltaData = ncov.matchAll(/>전일대비<[\s\S]*?>.*?([\d,]+)</g);
  const overseaConfirmedDelta = ncov.match(/>해외유입<[\s\S]*?>([\d,]+)</)?.[1];
  const testing = ncov.match(
    />누적 검사현황[\s\S]*?(<td>[\s\S]*?){7}([\d,]+)/,
  )?.[2];
  const date = ncov.match(/t_date">\(([\d.]+)/)?.[1];

  if (!deltaData || !accData || !overseaConfirmedDelta || !testing || !date) {
    return null;
  }

  const [confirmedAcc, releasedAcc, activeAcc, deathAcc] = [...accData].map(
    (i) => parseNumber(i[1]),
  );
  const [confirmedDelta, releasedDelta, activeDelta, deathDelta] = [
    ...deltaData,
  ].map((i) => parseNumber(i[1]));

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

const makeEmbedWithData = async (
  data: NonNullable<ThenArg<ReturnType<typeof parseNcov>>>,
  graphUrl: string,
) =>
  new MessageEmbed()
    .setTitle(`대한민국 코로나19 확진 정보 (${formatDate(data.date)} 기준)`)
    .setDescription(
      stripIndents`
      **확진자 현황**
      <:case:905316440452792320> **누적 확진**: ${
        data.confirmedAcc
      } \`전일 대비 ${increase(data.confirmedDelta)}\`
      <:search:905316440566034432> **검사 중**: ${data.testing}
      <:medicine:905316440377266228> **치료 중**: ${
        data.activeAcc
      } \`전일 대비 ${increase(data.activeDelta)}\`
      <:cure:905316440272429107> **완치**: ${
        data.releasedAcc
      } \`전일 대비 ${increase(data.releasedDelta)}\`
      <:death:905316440440176690> **사망**:  ${
        data.deathAcc
      } \`전일 대비 ${increase(data.deathDelta)}\`
    `,
    )
    .setColor(0x00669a)
    .setFooter('지자체에서 자체 집계한 자료와는 차이가 있을 수 있습니다.')
    .setImage(graphUrl);

const parseLocalData = async () => {
  const data = await (
    await fetch('http://ncov.mohw.go.kr/bdBoardList_Real.do?brdGubun=13')
  ).text();

  return [
    ...data.matchAll(
      /<tr>.*row">(.*?)<.*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,]*).*?">([\d,.]*)/g,
    ),
  ]
    .map(
      ([, location, ...match]) =>
        [location, ...match.map(parseNumber)] as const,
    )
    .reduce(
      (prev, curr) => ({
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
      }),
      {} as {
        [key in Exclude<typeof disaster.disasterRegion[number], '전국'>]: {
          confirmedDelta: number;
          overseaConfirmedDelta: number;

          confirmedAcc: number;
          activeAcc: number;

          releasedAcc: number;
          deathAcc: number;

          incidence: number;
        };
      },
    );
};

type Value<T> = T[keyof T];

const makeEmbedWithLocalData = (
  location: string,
  data: Value<ThenArg<ReturnType<typeof parseLocalData>>>,
) => {
  const embed = new MessageEmbed();
  embed.setTitle(`시/도 확진자 수 조회 - ${location}`)
    .setDescription(stripIndents`
      <:nujeok:687907310923677943> **확진자** : ${
        data.confirmedAcc
      }명(${increase(data.confirmedDelta)})
      <:chiryojung:711728328985411616> **치료중** : ${data.activeAcc}명
      <:wanchi:687907312052076594> 완치 : ${data.releasedAcc}명
      <:samang:687907312123510817> 사망 : ${data.deathAcc}명
    `);
  return embed;
};

type Element = NonNullable<
  ReturnType<JSDOM['window']['document']['querySelector']>
>;

const parseInnerHTMLNumber = (doc?: Element | null, defaultValue = -1) =>
  Number.parseInt(doc?.innerHTML ?? `${defaultValue}`, 10);

const getDataFromXML = (
  beforeDoc: Element,
  afterDoc: Element,
): Parameters<typeof makeEmbedWithData>[0] => ({
  activeAcc: parseInnerHTMLNumber(afterDoc.querySelector('careCnt')),
  activeDelta:
    parseInnerHTMLNumber(afterDoc.querySelector('careCnt')) -
    parseInnerHTMLNumber(beforeDoc.querySelector('careCnt')),
  confirmedAcc: parseInnerHTMLNumber(afterDoc.querySelector('decideCnt')),
  confirmedDelta:
    parseInnerHTMLNumber(afterDoc.querySelector('decideCnt')) -
    parseInnerHTMLNumber(beforeDoc.querySelector('decideCnt')),
  date: new Date(afterDoc.querySelector('createDt')?.innerHTML || ''),
  deathAcc: parseInnerHTMLNumber(afterDoc.querySelector('deathCnt')),
  deathDelta:
    parseInnerHTMLNumber(afterDoc.querySelector('deathCnt')) -
    parseInnerHTMLNumber(beforeDoc.querySelector('deathCnt')),
  overseaConfirmedDelta: 0,
  releasedAcc: parseInnerHTMLNumber(afterDoc.querySelector('clearCnt')),
  releasedDelta:
    parseInnerHTMLNumber(afterDoc.querySelector('clearCnt')) -
    parseInnerHTMLNumber(beforeDoc.querySelector('clearCnt')),
  testing: parseInnerHTMLNumber(afterDoc.querySelector('examCnt')),
});

export default class StatusCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'status',
      aliases: ['현황'],
      description: 'status command',
      group: 'commands',
      memberName: 'status',
      args: [
        {
          key: 'location',
          prompt: '',
          type: 'string',
          default: '',
        },
      ],
    });
  }

  async run(msg: CommandoMessage, { location }: { location: string }) {
    if (location) {
      const data = await parseBoard();
      if (data) {
        const country =
          // eslint-disable-next-line no-nested-ternary
          location === '오스트레일리아'
            ? '호주'
            : location === '우리나라' || location === '한국'
            ? '대한민국'
            : location;
        const cc = Object.entries(data.i18nAll.ko).find(
          ([k, v]) => v === country && k.length === 2,
        )?.[0];

        if (cc) {
          const status = data.statGlobalNow.find((stat) => stat.cc === cc);
          if (status) {
            const embed = new MessageEmbed();
            embed
              .setTitle(`${status.flag} 국가별 현황 - ${location}`)
              .setDescription(
                stripIndents`
              ${oneLine`
                <:nujeok:687907310923677943> 확진자 :
                ${format(status.confirmed)}명(${increase(
                status.confirmed - status.confirmed_prev,
              )})
              `}
              ${oneLine`
                <:wanchi:687907312052076594> 완치 :
                ${format(status.released)}명(${increase(
                status.released - status.released_prev,
              )}) -
                ${Math.round((status.released / status.confirmed) * 100)}%
              `}
              ${oneLine`
                <:samang:687907312123510817> 사망 :
                ${format(status.death)}명(${increase(
                status.death - status.death_prev,
              )}) -
                ${Math.round((status.death / status.confirmed) * 100)}%
              `}
            `,
              )
              .setColor(0x00bfff);
            return msg.channel.send(embed);
          }
        }
      }

      const localData = await parseLocalData();
      if (!Object.keys(localData).includes(location)) {
        return msg.channel.send(stripIndents`
        지원하지 않는 지역입니다.
        다음 중 하나를 입력해 주세요: \`${Object.keys(localData).join(
          ' ',
        )}\` 또는 \`국가 이름\`
      `);
      }
      return msg.channel.send(
        makeEmbedWithLocalData(
          location,
          localData[location as keyof typeof localData],
        ),
      );
    }
    const ncov = await (
      await fetch(
        `http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19InfStateJson?ServiceKey=${
          config.openApiKey
        }&pageNo=1&numOfRows=7&startCreateDt=${dayjs()
          .subtract(8, 'day')
          .format('YYYYMMDD')}&endCreateDt=${dayjs().format('YYYYMMDD')}`,
      )
    ).text();
    const ncovDoc = new JSDOM(ncov);
    const items = ncovDoc.window.document.querySelectorAll('item');
    const data = getDataFromXML(items[1], items[0]);

    const graph = await Graphs.findOne({}, {}, { sort: { createdAt: -1 } });
    if (!graph || !dayjs(graph.referenceDate).isSame(dayjs(data.date))) {
      const graphChannel = this.client.channels.cache.get(
        config.graphChannelId,
      ) as TextChannel;
      const graphMessage = await graphChannel.send(
        new MessageAttachment(
          await makeGraph(
            Array.from(items)
              .slice(0, -1)
              .map((item, index) => ({
                confirmed:
                  parseInnerHTMLNumber(item.querySelector('decideCnt')) -
                  parseInnerHTMLNumber(
                    items[index + 1].querySelector('decideCnt'),
                  ),
                date: new Date(item.querySelector('createDt')?.innerHTML || ''),
                death:
                  parseInnerHTMLNumber(item.querySelector('deathCnt')) -
                  parseInnerHTMLNumber(
                    items[index + 1].querySelector('deathCnt'),
                  ),
                released:
                  parseInnerHTMLNumber(item.querySelector('clearCnt')) -
                  parseInnerHTMLNumber(
                    items[index + 1].querySelector('clearCnt'),
                  ),
              })),
          ),
        ),
      );
      const url = graphMessage.attachments.first()?.url || '';
      await Graphs.create({
        url,
        referenceDate: data.date,
      });
      const embed = await makeEmbedWithData(data, url);
      embed.setTitle('🔄 현황 변경 안내');
      send(this.client, embed).then(({ toSendSize, sended }) => {
        (graphChannel as TextChannel).send(`${sended}/${toSendSize}`);
      });
      return msg.channel.send(await makeEmbedWithData(data, url));
    }

    return msg.channel.send(await makeEmbedWithData(data, graph.url));
  }
}
