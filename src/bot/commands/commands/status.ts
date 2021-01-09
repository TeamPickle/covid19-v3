import { oneLine, stripIndents } from 'common-tags';
import { MessageEmbed } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import fetch from 'node-fetch';

const parseNumber = (i: string) => +i.replace(/(,| )/g, '');
const increase = (i: number) => (
  // eslint-disable-next-line no-nested-ternary
  i > 0 ? `▲${i}`
    : i < 0 ? `▼${i}` : '-0');
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

  const parsedDate = new Date(date);
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

export default class StatusCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'status',
      aliases: ['현황'],
      description: 'status command',
      group: 'commands',
      memberName: 'status',
    });
  }

  run = async (msg: CommandoMessage) => {
    const data = await parseNcov();
    if (!data) return null;

    console.log(data);

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
    return msg.channel.send(embed);
  }
}
