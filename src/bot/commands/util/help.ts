import { Client, DiscordAPIError, MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';
import helpData from '@src/bot/data/util/help';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';
import { getGuildPrefix } from '@src/bot/util/prefix';

export default class HelpCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'help',
      aliases: ['h', '도움', '도움말'],
      description: 'help command',
    });
  }

  runCommand = async (msg: ReceivedMessage, [, detail]: string[]) => {
    const prefix = getGuildPrefix(msg.guild);
    if (detail) {
      const commands = Object.keys(helpData.detail);
      if (!commands.includes(detail)) {
        return msg.respond(stripIndents`
          존재하지 않는 명령어 입니다.
          \`${commands.join(', ')}\` 중 하나를 입력해주세요.
        `);
      }
      const command = helpData.detail[detail as keyof typeof helpData.detail];
      const embed = new MessageEmbed()
        .setTitle(`${prefix} ${detail} ${command.title}`)
        .setDescription(command.desc.replace(/{prefix}/g, prefix));
      return msg.respond({ embeds: [embed] });
    }
    const isDm = msg.channel.type === 'DM';
    const embed = new MessageEmbed()
      .setTitle(isDm ? helpData.dmTitle : helpData.serverTitle)
      .setDescription(
        '코로나19와 관련된 국내외 소식과 관련 정보를 전해드립니다.',
      )
      .setColor(0x0077aa)
      .addField('주 명령어', helpData.mainCommand.replace(/{prefix}/g, prefix))
      .addField(
        '설정 및 옵션',
        stripIndents`
          ${helpData.globalSetting}

          ${isDm ? helpData.dmSetting : helpData.serverSetting}
        `.replace(/{prefix}/g, prefix),
      )
      .addField(
        '부가 명령어({prefix}도움 [명령어이름]으로 확인가능)'.replace(
          /{prefix}/g,
          prefix,
        ),
        (isDm ? helpData.dmCommand : helpData.serverCommand).replace(
          /{prefix}/g,
          prefix,
        ),
      )
      .addField('봇 초대', 'http://covid19bot.tpk.kr', true)
      .addField('버그 신고', 'http://forum.tpk.kr', true);
    try {
      await msg.author.send({ embeds: [embed] });
      if (!isDm) return msg.respond('명령어 리스트를 DM으로 전송했습니다.');
    } catch (e) {
      if (e instanceof DiscordAPIError) {
        embed.addField(
          '⚠️',
          'DM으로 보낼 수 없어 서버 채팅으로 보내진 메시지입니다.',
        );
        return msg.respond({ embeds: [embed] });
      }
      throw e;
    }
    return null;
  };
}
