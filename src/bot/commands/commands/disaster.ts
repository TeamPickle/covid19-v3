import { oneLine, stripIndents } from 'common-tags';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import disasterData from '@src/bot/data/commands/disaster';
import fetch from 'node-fetch';
import { MessageEmbed } from 'discord.js';

export default class DisasterCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'disaster',
      aliases: ['재난문자'],
      description: 'disaster command',
      group: 'commands',
      memberName: 'disaster',
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
    if (!location) {
      return msg.channel.send(stripIndents`
        명령어 사용법 : \`${msg.guild?.commandPrefix || this.client.commandPrefix}재난문자 [지역]\`
        지역 목록 : \`${disasterData.disasterRegion.join(' ')}\`
      `);
    }
    const u = Object.keys(disasterData.disasterAlias).includes(location)
      ? disasterData.disasterAlias[location as keyof typeof disasterData.disasterAlias]
      : location;

    const disasterIndex = disasterData.disasterRegion.indexOf(u);
    
    if (disasterIndex < 0) {
      return msg.channel.send(stripIndents`
        지원하지 않는 지역입니다. 다음 지역 중 하나로 다시 시도해주세요.
        \`${disasterData.disasterRegion.join(' ')}\`
      `);
    }

    const source: string = (await (await fetch(
      `https://m.search.naver.com/p/csearch/content/nqapirender.nhn?where=m&pkid=258&key=disasterAlert&u1=${
        disasterIndex ? disasterIndex.toString().padStart(2, '0') : ''
      }`
    )).json()).current.html;

    const local = [...source.matchAll(/<em class="area_name">(.+?)<\/em>/g)];
    const con = [...source.matchAll(/<span class="dsc _text">(.+?)<\/span>/g)];
    const distime = [...source.matchAll(/<time datetime="">(.+?)<\/time>/g)];

    if (local.length === 0 && con.length === 0) {
      return msg.channel.send('재난문자를 불러올 수 없습니다.')
    }

    const embed = new MessageEmbed();
    embed
      .setTitle('📌 재난문자')
      .setDescription(`${u} 지역의 최근 5개 재난문자 목록입니다.`)
      .setColor(0xdd2255)
      .addFields([...Array(5)].map((_, i) => ({
        name: `${local[i][1]}(${distime[i][1]})`.slice(0, 256),
        value: con[i][1],
      })));
    return msg.channel.send(embed);
  }
}
