import { DiscordAPIError, MessageEmbed } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { stripIndents } from 'common-tags';
import helpData from '@src/bot/data/util/help';

export default class HelpCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'help',
      aliases: ['h', '도움', '도움말'],
      description: 'help command',
      group: 'util',
      memberName: 'help',
      argsPromptLimit: 0,
      args: [
        {
          key: 'detail',
          type: 'string',
          prompt: '',
          default: '',
        },
      ],
    });
  }

  run = async (msg: CommandoMessage, { detail }: { detail: string }) => {
    const prefix = msg.guild?.commandPrefix || this.client.commandPrefix;
    if (detail) {
      const commands = Object.keys(helpData.detail);
      if (!commands.includes(detail)) {
        return msg.channel.send(stripIndents`
          존재하지 않는 명령어 입니다.
          \`${commands.join(', ')}\` 중 하나를 입력해주세요.
        `);
      }
      const command = helpData.detail[detail as keyof typeof helpData.detail];
      const embed = new MessageEmbed()
        .setTitle(`${prefix} ${detail} ${command.title}`)
        .setDescription(command.desc.replace(/{prefix}/g, prefix));
      return msg.channel.send(embed);
    }
    const isDm = msg.channel.type === 'dm';
    const embed = new MessageEmbed()
      .setTitle(isDm ? helpData.dmTitle : helpData.serverTitle)
      .setDescription('코로나19와 관련된 국내외 소식과 관련 정보를 전해드립니다.')
      .setColor(0x0077aa)
      .addField(
        '주 명령어',
        helpData.mainCommand.replace(/{prefix}/g, prefix),
      )
      .addField(
        '설정 및 옵션',
        (isDm ? helpData.dmSetting : helpData.serverSetting).replace(/{prefix}/g, prefix),
      )
      .addField(
        '부가 명령어({prefix}도움 [명령어이름]으로 확인가능)'.replace(/{prefix}/g, prefix),
        (isDm ? helpData.dmCommand : helpData.serverCommand).replace(/{prefix}/g, prefix),
      )
      .addField(
        '봇 초대',
        'http://covid19bot.tpk.kr',
        true,
      )
      .addField(
        '버그 신고',
        'http://forum.tpk.kr',
        true,
      );
    try {
      await msg.author.send(embed);
      if (!isDm) return msg.channel.send('명령어 리스트를 DM으로 전송했습니다.');
    } catch (e) {
      if (e instanceof DiscordAPIError) {
        embed.addField('⚠️', 'DM으로 보낼 수 없어 서버 채팅으로 보내진 메시지입니다.');
        return msg.channel.send(embed);
      }
      throw e;
    }
    return null;
  }
}
