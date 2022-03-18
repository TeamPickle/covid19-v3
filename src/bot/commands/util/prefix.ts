import { Client } from 'discord.js';
import Settings from '@src/bot/models/settingsModel';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';
import { getGuildPrefix, setGuildPrefix } from '@src/bot/util/prefix';

export default class PrefixCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'prefix',
      aliases: ['접두사설정'],
      description: 'prefix command',
      commandOnly: 'onlyDM',
    });
  }

  runCommand = async (msg: ReceivedMessage, [, prefix]: string[]) => {
    const member = await msg.guild?.members.fetch(msg.author.id);
    if (!member?.permissions.has('ADMINISTRATOR')) {
      return msg.channel.send('서버관리자만 접두사를 변경할 수 있습니다.');
    }
    if (!msg.guild) return null;

    const originalPrefix = getGuildPrefix(msg.guild);
    if (!prefix) {
      return msg.channel.send(
        `명령어 사용법: \`${originalPrefix}접두사설정 !\``,
      );
    }
    await Settings.updateOne(
      { _id: msg.guild.id },
      { $set: { prefix } },
      { upsert: true },
    );
    setGuildPrefix(msg.guild, prefix);
    return msg.channel.send(
      `${prefix}(으)로 접두사를 변경했습니다. \`${prefix}도움\`과 같이 사용하실 수 있습니다.`,
    );
  };
}
