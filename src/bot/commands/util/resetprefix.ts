import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import Settings from '@src/bot/models/settingsModel';

export default class ResetPrefixCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'resetprefix',
      aliases: ['접두사초기화'],
      description: 'resetprefix command',
      group: 'util',
      memberName: 'resetprefix',
      guildOnly: true,
      patterns: [/^!resetprefix$/, /^!접두사초기화$/],
    });
  }

  async run(msg: CommandoMessage) {
    if (!msg.member?.permissions.has('ADMINISTRATOR')) {
      return msg.channel.send('서버관리자만 접두사를 변경할 수 있습니다.');
    }
    const { guild } = msg;
    guild.commandPrefix = this.client.commandPrefix;
    await Settings.updateOne({ _id: msg.guild.id }, { $unset: { prefix: '' } }, { upsert: true });
    return msg.channel.send('접두사를 초기화 했습니다. ``!도움``과 같이 사용하실 수 있습니다.');
  }
}
