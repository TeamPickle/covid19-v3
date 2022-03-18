import { stripIndents } from 'common-tags';
import fetch from 'node-fetch';
import { Client, MessageEmbed } from 'discord.js';
import disasterData from '@src/bot/data/commands/disaster';
import Locations from '@src/bot/models/locationModel';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';
import { getGuildPrefix } from '@src/bot/util/prefix';

const getLocation = async (userId: string, location: string) => {
  if (location) return location;
  const row = await Locations.findById(userId);
  return row?.location.split(' ')[0] || '';
};

export default class DisasterCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'disaster',
      aliases: ['재난문자'],
      description: 'disaster command',
    });
  }

  public runCommand = async (msg: ReceivedMessage, args: string[]) => {
    const location = await getLocation(msg.author.id, args[1]);
    if (!location) {
      return msg.respond(stripIndents`
        명령어 사용법 : \`${getGuildPrefix(msg.guild)}재난문자 [지역]\`
        지역 목록 : \`${disasterData.disasterRegion.join(' ')}\`
      `);
    }
    const u = (
      Object.keys(disasterData.disasterAlias).includes(location)
        ? disasterData.disasterAlias[
            location as keyof typeof disasterData.disasterAlias
          ]
        : location
    ) as typeof disasterData.disasterRegion[number];

    const disasterIndex = disasterData.disasterRegion.indexOf(u);

    if (disasterIndex < 0) {
      return msg.respond(stripIndents`
        지원하지 않는 지역입니다. 다음 지역 중 하나로 다시 시도해주세요.
        \`${disasterData.disasterRegion.join(' ')}\`
      `);
    }

    const source: string = (
      await (
        await fetch(
          `https://m.search.naver.com/p/csearch/content/nqapirender.nhn?where=m&pkid=258&key=disasterAlert&u1=${
            disasterIndex ? disasterIndex.toString().padStart(2, '0') : ''
          }`,
        )
      ).json()
    ).current.html;

    const local = [...source.matchAll(/<em class="area_name">(.+?)<\/em>/g)];
    const con = [...source.matchAll(/<span class="dsc _text">(.+?)<\/span>/g)];
    const distime = [...source.matchAll(/<time datetime="">(.+?)<\/time>/g)];

    if (local.length === 0 && con.length === 0) {
      return msg.respond('재난문자를 불러올 수 없습니다.');
    }

    const embed = new MessageEmbed();
    embed
      .setTitle('📌 재난문자')
      .setDescription(`${u} 지역의 최근 5개 재난문자 목록입니다.`)
      .setColor(0xdd2255)
      .addFields(
        [...Array(5)].map((_, i) => ({
          name: `${local[i][1]}(${distime[i][1]})`.slice(0, 256),
          value: con[i][1],
        })),
      );
    return msg.respond({ embeds: [embed] });
  };
}
